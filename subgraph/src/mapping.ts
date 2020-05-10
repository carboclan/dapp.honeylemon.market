import {
    Fill as FillEvent,
    Cancel as CancelEvent,
    SignatureValidatorApproval,
    Fill__Params,
} from './types/ExchangeV3/ExchangeV3';
import {
    PositionTokensMinted as PositionTokensMintedEvent,
    PositionTokensMinted__Params,
} from './types/MarketContractProxy/MarketContractProxy';
import { Order, User, CancelledOrder, Fill, Transaction, Contract } from './types/schema';
import { Bytes, ethereum } from '@graphprotocol/graph-ts';

function _findOrCreateUser(addressHex: string): User {
    let user = User.load(addressHex);
    if (user == null) {
        user = new User(addressHex);
        user.save();
    }
    return user as User;
}

function _findOrCreateOrder(params: Fill__Params): Order {
    let id = params.orderHash.toHex();
    let order = Order.load(id);
    if (order == null) {
        order = new Order(id);
        order.maker = params.makerAddress.toHex();
        order.feeRecipient = params.feeRecipientAddress;
        order.makerAssetData = params.makerAssetData;
        order.takerAssetData = params.takerAssetData;
        order.createdAt = params._event.block.number;
        order.save();
    }
    return order as Order;
}

function _createTransaction(event: ethereum.Event): Transaction {
    let id = event.transaction.hash.toHex();
    let transaction = new Transaction(id);
    transaction.from = event.transaction.from;
    transaction.gasUsed = event.transaction.gasUsed;
    transaction.gasPrice = event.transaction.gasPrice;
    transaction.to = event.transaction.to as Bytes;
    transaction.blockNumber = event.block.number;
    transaction.save();
    return transaction as Transaction;
}

function _createFill(event: FillEvent, order: Order): Fill {
    let id = event.params.orderHash
        .toHex()
        .concat('-')
        .concat(event.transaction.hash.toHex())
        .concat('-')
        .concat(event.logIndex.toString());
    let fill = new Fill(id);
    let params = event.params;
    fill.orderHash = params.orderHash.toHex();
    fill.maker = params.makerAddress.toHex();
    fill.taker = params.takerAddress.toHex();
    fill.makerAssetFilledAmount = params.makerAssetFilledAmount;
    fill.takerAssetFilledAmount = params.takerAssetFilledAmount;
    fill.sender = params.senderAddress;
    fill.makerFeePaid = params.makerFeePaid;
    fill.takerFeePaid = params.takerFeePaid;
    fill.order = order.id;
    fill.transaction = event.transaction.hash.toHex();
    fill.transactionHash = event.transaction.hash.toHex();
    fill.createdAt = event.block.number;
    fill.save();
    return fill;
}

export function handleFill(event: FillEvent): void {
    let maker = _findOrCreateUser(event.params.makerAddress.toHex());
    let taker = _findOrCreateUser(event.params.takerAddress.toHex());
    let feeRecipient = _findOrCreateUser(event.params.feeRecipientAddress.toHex());
    let order = _findOrCreateOrder(event.params);
    let fill = _createFill(event, order);
    let transaction = _createTransaction(event);
}

export function handleCancel(event: CancelEvent): void {
    let id = event.params.orderHash.toHex();
}

function _createContract(event: PositionTokensMintedEvent): Contract {
    let id = event.params.marketId
        .toString()
        .concat('-')
        .concat(event.transaction.hash.toHex())
        .concat('-')
        .concat(event.logIndex.toString());
    let contract = new Contract(id);
    let params = event.params;
    contract.marketId = params.marketId;
    contract.contractName = 'test'; // TODO: params.contractName.replace('0x00', '');
    contract.longTokenRecipient = params.longTokenRecipient.toHex();
    contract.shortTokenRecipient = params.shortTokenRecipient.toHex();
    contract.qtyToMint = params.qtyToMint;
    contract.latestMarketContract = params.latestMarketContract;
    contract.longTokenAddress = params.longTokenAddress;
    contract.shortTokenAddress = params.shortTokenAddress;
    contract.time = params.time;
    contract.transaction = event.transaction.hash.toHex();
    contract.transactionHash = event.transaction.hash.toHex();
    contract.createdAt = event.block.number;
    contract.save();
    return contract;
}

export function handlePositionTokensMinted(event: PositionTokensMintedEvent): void {
    let maker = _findOrCreateUser(event.params.shortTokenRecipient.toHex());
    let taker = _findOrCreateUser(event.params.longTokenRecipient.toHex());
    let positionTokensMinted = _createContract(event);
    let transaction = _createTransaction(event);
}
