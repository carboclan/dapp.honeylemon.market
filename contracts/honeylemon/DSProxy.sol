pragma solidity 0.5.2;


contract DSNote {
    event LogNote(
        bytes4 indexed sig,
        address indexed guy,
        bytes32 indexed foo,
        bytes32 bar,
        uint wad,
        bytes fax
    );

    modifier note {
        bytes32 foo;
        bytes32 bar;

        assembly {
            foo := calldataload(4)
            bar := calldataload(36)
        }
        emit LogNote(msg.sig, msg.sender, foo, bar, msg.value, msg.data);

        _;
    }
}


contract DSAuthority {
    function canCall(address src, address dst, bytes4 sig) public view returns (bool);
}


contract DSAuthEvents {
    event LogSetAuthority(address indexed authority);
    event LogSetOwner(address indexed owner);
}


contract DSAuth is DSAuthEvents {
    DSAuthority public authority;
    address public owner;

    constructor() public {
        owner = msg.sender;
        emit LogSetOwner(msg.sender);
    }

    function setOwner(address owner_) public auth {
        owner = owner_;
        emit LogSetOwner(owner);
    }

    function setAuthority(DSAuthority authority_) public auth {
        authority = authority_;
        emit LogSetAuthority(address(authority));
    }

    modifier auth {
        require(isAuthorized(msg.sender, msg.sig));
        _;
    }

    function isAuthorized(address src, bytes4 sig) internal view returns (bool) {
        if (src == address(this)) {
            return true;
        } else if (src == owner) {
            return true;
        } else if (authority == DSAuthority(0)) {
            return false;
        } else {
            return authority.canCall(src, address(this), sig);
        }
    }
}


// DSProxy
// Allows code execution using a persistant identity This can be very
// useful to execute a sequence of atomic actions. Since the owner of
// the proxy can be changed, this allows for dynamic ownership models
// i.e. a multisig
contract DSProxy is DSAuth, DSNote {
    DSProxyCache public cache; // global cache for contracts

    constructor(address _cacheAddr) public {
        setCache(_cacheAddr);
    }

    function() external payable {}

    // use the proxy to execute calldata _data on contract _code
    // function execute(bytes memory _code, bytes memory _data)
    //     public
    //     payable
    //     returns (address target, bytes memory response)
    // {
    //     target = cache.read(_code);
    //     if (target == address(0)) {
    //         // deploy contract & store its address in cache
    //         target = cache.write(_code);
    //     }

    //     response = execute(target, _data);
    // }

    function execute(address _target, bytes memory _data)
        public
        payable
        auth
        note
        returns (bytes memory response)
    {
        require(_target != address(0), 'ds-proxy-target-address-required');

        // call contract in current context
        assembly {
            let succeeded := delegatecall(
                sub(gas, 5000),
                _target,
                add(_data, 0x20),
                mload(_data),
                0,
                0
            )
            let size := returndatasize

            response := mload(0x40)
            mstore(0x40, add(response, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            mstore(response, size)
            returndatacopy(add(response, 0x20), 0, size)

            switch iszero(succeeded)
                case 1 {
                    // throw if delegatecall failed
                    revert(add(response, 0x20), size)
                }
        }
    }

    //set new cache
    function setCache(address _cacheAddr) public payable auth note returns (bool) {
        require(_cacheAddr != address(0), 'ds-proxy-cache-address-required');
        cache = DSProxyCache(_cacheAddr); // overwrite cache
        return true;
    }
}


// DSProxyFactory
// This factory deploys new proxy instances through build()
// Deployed proxy addresses are logged
contract DSProxyFactory {
    event Created(
        address indexed sender,
        address indexed owner,
        address proxy,
        address cache
    );
    mapping(address => bool) public isProxy;
    DSProxyCache public cache;
    address marketContractProxy;

    constructor() public {
        marketContractProxy = msg.sender;
        cache = new DSProxyCache();
    }

    modifier onlyMarketContractProxy() {
        require(
            msg.sender == marketContractProxy,
            'Only callable by MarketContractProxy'
        );
        _;
    }

    // deploys a new proxy instance
    // sets custom owner of proxy
    function build(address owner)
        public
        onlyMarketContractProxy()
        returns (address payable proxy)
    {
        proxy = address(new DSProxy(address(cache)));
        emit Created(msg.sender, owner, address(proxy), address(cache));
        DSProxy(proxy).setOwner(owner);
        isProxy[proxy] = true;
    }

    // deploys a new proxy instance
    // sets owner of proxy to caller
    function build() internal returns (address payable proxy) {
        proxy = build(msg.sender);
    }
}


// DSProxyCache
// This global cache stores addresses of contracts previously deployed
// by a proxy. This saves gas from repeat deployment of the same
// contracts and eliminates blockchain bloat.

// By default, all proxies deployed from the same factory store
// contracts in the same cache. The cache a proxy instance uses can be
// changed.  The cache uses the sha3 hash of a contract's bytecode to
// lookup the address
contract DSProxyCache {
    mapping(bytes32 => address) cache;

    function read(bytes memory _code) public view returns (address) {
        bytes32 hash = keccak256(_code);
        return cache[hash];
    }

    function write(bytes memory _code) public returns (address target) {
        assembly {
            target := create(0, add(_code, 0x20), mload(_code))
            switch iszero(extcodesize(target))
                case 1 {
                    // throw if contract failed to deploy
                    revert(0, 0)
                }
        }
        bytes32 hash = keccak256(_code);
        cache[hash] = target;
    }
}
