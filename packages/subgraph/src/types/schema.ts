// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class User extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save User entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save User entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("User", id.toString(), this);
  }

  static load(id: string): User | null {
    return store.get("User", id) as User | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get fillsAsTaker(): Array<string> | null {
    let value = this.get("fillsAsTaker");
    if (value === null) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set fillsAsTaker(value: Array<string> | null) {
    if (value === null) {
      this.unset("fillsAsTaker");
    } else {
      this.set("fillsAsTaker", Value.fromStringArray(value as Array<string>));
    }
  }

  get fillsAsMaker(): Array<string> | null {
    let value = this.get("fillsAsMaker");
    if (value === null) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set fillsAsMaker(value: Array<string> | null) {
    if (value === null) {
      this.unset("fillsAsMaker");
    } else {
      this.set("fillsAsMaker", Value.fromStringArray(value as Array<string>));
    }
  }

  get orders(): Array<string> | null {
    let value = this.get("orders");
    if (value === null) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set orders(value: Array<string> | null) {
    if (value === null) {
      this.unset("orders");
    } else {
      this.set("orders", Value.fromStringArray(value as Array<string>));
    }
  }

  get positionsAsMaker(): Array<string> | null {
    let value = this.get("positionsAsMaker");
    if (value === null) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set positionsAsMaker(value: Array<string> | null) {
    if (value === null) {
      this.unset("positionsAsMaker");
    } else {
      this.set(
        "positionsAsMaker",
        Value.fromStringArray(value as Array<string>)
      );
    }
  }

  get positionsAsTaker(): Array<string> | null {
    let value = this.get("positionsAsTaker");
    if (value === null) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set positionsAsTaker(value: Array<string> | null) {
    if (value === null) {
      this.unset("positionsAsTaker");
    } else {
      this.set(
        "positionsAsTaker",
        Value.fromStringArray(value as Array<string>)
      );
    }
  }
}

export class Transaction extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Transaction entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Transaction entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Transaction", id.toString(), this);
  }

  static load(id: string): Transaction | null {
    return store.get("Transaction", id) as Transaction | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get blockNumber(): BigInt {
    let value = this.get("blockNumber");
    return value.toBigInt();
  }

  set blockNumber(value: BigInt) {
    this.set("blockNumber", Value.fromBigInt(value));
  }

  get gasUsed(): BigInt {
    let value = this.get("gasUsed");
    return value.toBigInt();
  }

  set gasUsed(value: BigInt) {
    this.set("gasUsed", Value.fromBigInt(value));
  }

  get gasPrice(): BigInt {
    let value = this.get("gasPrice");
    return value.toBigInt();
  }

  set gasPrice(value: BigInt) {
    this.set("gasPrice", Value.fromBigInt(value));
  }

  get fills(): Array<string> | null {
    let value = this.get("fills");
    if (value === null) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set fills(value: Array<string> | null) {
    if (value === null) {
      this.unset("fills");
    } else {
      this.set("fills", Value.fromStringArray(value as Array<string>));
    }
  }

  get from(): Bytes {
    let value = this.get("from");
    return value.toBytes();
  }

  set from(value: Bytes) {
    this.set("from", Value.fromBytes(value));
  }

  get to(): Bytes {
    let value = this.get("to");
    return value.toBytes();
  }

  set to(value: Bytes) {
    this.set("to", Value.fromBytes(value));
  }
}

export class Fill extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Fill entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Fill entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Fill", id.toString(), this);
  }

  static load(id: string): Fill | null {
    return store.get("Fill", id) as Fill | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get createdAt(): BigInt {
    let value = this.get("createdAt");
    return value.toBigInt();
  }

  set createdAt(value: BigInt) {
    this.set("createdAt", Value.fromBigInt(value));
  }

  get transaction(): string {
    let value = this.get("transaction");
    return value.toString();
  }

  set transaction(value: string) {
    this.set("transaction", Value.fromString(value));
  }

  get transactionHash(): string {
    let value = this.get("transactionHash");
    return value.toString();
  }

  set transactionHash(value: string) {
    this.set("transactionHash", Value.fromString(value));
  }

  get order(): string {
    let value = this.get("order");
    return value.toString();
  }

  set order(value: string) {
    this.set("order", Value.fromString(value));
  }

  get maker(): string {
    let value = this.get("maker");
    return value.toString();
  }

  set maker(value: string) {
    this.set("maker", Value.fromString(value));
  }

  get taker(): string {
    let value = this.get("taker");
    return value.toString();
  }

  set taker(value: string) {
    this.set("taker", Value.fromString(value));
  }

  get orderHash(): string {
    let value = this.get("orderHash");
    return value.toString();
  }

  set orderHash(value: string) {
    this.set("orderHash", Value.fromString(value));
  }

  get makerFeePaid(): BigInt {
    let value = this.get("makerFeePaid");
    return value.toBigInt();
  }

  set makerFeePaid(value: BigInt) {
    this.set("makerFeePaid", Value.fromBigInt(value));
  }

  get takerFeePaid(): BigInt {
    let value = this.get("takerFeePaid");
    return value.toBigInt();
  }

  set takerFeePaid(value: BigInt) {
    this.set("takerFeePaid", Value.fromBigInt(value));
  }

  get makerAssetFilledAmount(): BigInt {
    let value = this.get("makerAssetFilledAmount");
    return value.toBigInt();
  }

  set makerAssetFilledAmount(value: BigInt) {
    this.set("makerAssetFilledAmount", Value.fromBigInt(value));
  }

  get takerAssetFilledAmount(): BigInt {
    let value = this.get("takerAssetFilledAmount");
    return value.toBigInt();
  }

  set takerAssetFilledAmount(value: BigInt) {
    this.set("takerAssetFilledAmount", Value.fromBigInt(value));
  }

  get sender(): Bytes {
    let value = this.get("sender");
    return value.toBytes();
  }

  set sender(value: Bytes) {
    this.set("sender", Value.fromBytes(value));
  }
}

export class Order extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Order entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Order entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Order", id.toString(), this);
  }

  static load(id: string): Order | null {
    return store.get("Order", id) as Order | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get createdAt(): BigInt {
    let value = this.get("createdAt");
    return value.toBigInt();
  }

  set createdAt(value: BigInt) {
    this.set("createdAt", Value.fromBigInt(value));
  }

  get maker(): string {
    let value = this.get("maker");
    return value.toString();
  }

  set maker(value: string) {
    this.set("maker", Value.fromString(value));
  }

  get feeRecipient(): Bytes {
    let value = this.get("feeRecipient");
    return value.toBytes();
  }

  set feeRecipient(value: Bytes) {
    this.set("feeRecipient", Value.fromBytes(value));
  }

  get makerAssetData(): Bytes {
    let value = this.get("makerAssetData");
    return value.toBytes();
  }

  set makerAssetData(value: Bytes) {
    this.set("makerAssetData", Value.fromBytes(value));
  }

  get takerAssetData(): Bytes {
    let value = this.get("takerAssetData");
    return value.toBytes();
  }

  set takerAssetData(value: Bytes) {
    this.set("takerAssetData", Value.fromBytes(value));
  }

  get fills(): Array<string> | null {
    let value = this.get("fills");
    if (value === null) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set fills(value: Array<string> | null) {
    if (value === null) {
      this.unset("fills");
    } else {
      this.set("fills", Value.fromStringArray(value as Array<string>));
    }
  }
}

export class CancelledOrder extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save CancelledOrder entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save CancelledOrder entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("CancelledOrder", id.toString(), this);
  }

  static load(id: string): CancelledOrder | null {
    return store.get("CancelledOrder", id) as CancelledOrder | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get maker(): Bytes {
    let value = this.get("maker");
    return value.toBytes();
  }

  set maker(value: Bytes) {
    this.set("maker", Value.fromBytes(value));
  }
}

export class Position extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Position entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Position entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Position", id.toString(), this);
  }

  static load(id: string): Position | null {
    return store.get("Position", id) as Position | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get createdAt(): BigInt {
    let value = this.get("createdAt");
    return value.toBigInt();
  }

  set createdAt(value: BigInt) {
    this.set("createdAt", Value.fromBigInt(value));
  }

  get transaction(): string {
    let value = this.get("transaction");
    return value.toString();
  }

  set transaction(value: string) {
    this.set("transaction", Value.fromString(value));
  }

  get transactionHash(): string {
    let value = this.get("transactionHash");
    return value.toString();
  }

  set transactionHash(value: string) {
    this.set("transactionHash", Value.fromString(value));
  }

  get marketId(): BigInt {
    let value = this.get("marketId");
    return value.toBigInt();
  }

  set marketId(value: BigInt) {
    this.set("marketId", Value.fromBigInt(value));
  }

  get contractName(): string {
    let value = this.get("contractName");
    return value.toString();
  }

  set contractName(value: string) {
    this.set("contractName", Value.fromString(value));
  }

  get longTokenRecipient(): string {
    let value = this.get("longTokenRecipient");
    return value.toString();
  }

  set longTokenRecipient(value: string) {
    this.set("longTokenRecipient", Value.fromString(value));
  }

  get shortTokenRecipient(): string {
    let value = this.get("shortTokenRecipient");
    return value.toString();
  }

  set shortTokenRecipient(value: string) {
    this.set("shortTokenRecipient", Value.fromString(value));
  }

  get qtyToMint(): BigInt {
    let value = this.get("qtyToMint");
    return value.toBigInt();
  }

  set qtyToMint(value: BigInt) {
    this.set("qtyToMint", Value.fromBigInt(value));
  }

  get contract(): string {
    let value = this.get("contract");
    return value.toString();
  }

  set contract(value: string) {
    this.set("contract", Value.fromString(value));
  }

  get longTokenAddress(): Bytes {
    let value = this.get("longTokenAddress");
    return value.toBytes();
  }

  set longTokenAddress(value: Bytes) {
    this.set("longTokenAddress", Value.fromBytes(value));
  }

  get shortTokenAddress(): Bytes {
    let value = this.get("shortTokenAddress");
    return value.toBytes();
  }

  set shortTokenAddress(value: Bytes) {
    this.set("shortTokenAddress", Value.fromBytes(value));
  }

  get longTokenDSProxy(): Bytes | null {
    let value = this.get("longTokenDSProxy");
    if (value === null) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set longTokenDSProxy(value: Bytes | null) {
    if (value === null) {
      this.unset("longTokenDSProxy");
    } else {
      this.set("longTokenDSProxy", Value.fromBytes(value as Bytes));
    }
  }

  get shortTokenDSProxy(): Bytes | null {
    let value = this.get("shortTokenDSProxy");
    if (value === null) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set shortTokenDSProxy(value: Bytes | null) {
    if (value === null) {
      this.unset("shortTokenDSProxy");
    } else {
      this.set("shortTokenDSProxy", Value.fromBytes(value as Bytes));
    }
  }

  get time(): BigInt {
    let value = this.get("time");
    return value.toBigInt();
  }

  set time(value: BigInt) {
    this.set("time", Value.fromBigInt(value));
  }
}

export class Contract extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Contract entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Contract entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Contract", id.toString(), this);
  }

  static load(id: string): Contract | null {
    return store.get("Contract", id) as Contract | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get createdAt(): BigInt {
    let value = this.get("createdAt");
    return value.toBigInt();
  }

  set createdAt(value: BigInt) {
    this.set("createdAt", Value.fromBigInt(value));
  }

  get transaction(): string {
    let value = this.get("transaction");
    return value.toString();
  }

  set transaction(value: string) {
    this.set("transaction", Value.fromString(value));
  }

  get transactionHash(): string {
    let value = this.get("transactionHash");
    return value.toString();
  }

  set transactionHash(value: string) {
    this.set("transactionHash", Value.fromString(value));
  }

  get currentMRI(): BigInt {
    let value = this.get("currentMRI");
    return value.toBigInt();
  }

  set currentMRI(value: BigInt) {
    this.set("currentMRI", Value.fromBigInt(value));
  }

  get contractName(): string {
    let value = this.get("contractName");
    return value.toString();
  }

  set contractName(value: string) {
    this.set("contractName", Value.fromString(value));
  }

  get expiration(): BigInt {
    let value = this.get("expiration");
    return value.toBigInt();
  }

  set expiration(value: BigInt) {
    this.set("expiration", Value.fromBigInt(value));
  }

  get index(): BigInt {
    let value = this.get("index");
    return value.toBigInt();
  }

  set index(value: BigInt) {
    this.set("index", Value.fromBigInt(value));
  }

  get collateralPerUnit(): BigInt {
    let value = this.get("collateralPerUnit");
    return value.toBigInt();
  }

  set collateralPerUnit(value: BigInt) {
    this.set("collateralPerUnit", Value.fromBigInt(value));
  }

  get settlement(): string | null {
    let value = this.get("settlement");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set settlement(value: string | null) {
    if (value === null) {
      this.unset("settlement");
    } else {
      this.set("settlement", Value.fromString(value as string));
    }
  }
}

export class ContractSettlement extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save ContractSettlement entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save ContractSettlement entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("ContractSettlement", id.toString(), this);
  }

  static load(id: string): ContractSettlement | null {
    return store.get("ContractSettlement", id) as ContractSettlement | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get createdAt(): BigInt {
    let value = this.get("createdAt");
    return value.toBigInt();
  }

  set createdAt(value: BigInt) {
    this.set("createdAt", Value.fromBigInt(value));
  }

  get revenuePerUnit(): BigInt {
    let value = this.get("revenuePerUnit");
    return value.toBigInt();
  }

  set revenuePerUnit(value: BigInt) {
    this.set("revenuePerUnit", Value.fromBigInt(value));
  }

  get index(): BigInt {
    let value = this.get("index");
    return value.toBigInt();
  }

  set index(value: BigInt) {
    this.set("index", Value.fromBigInt(value));
  }

  get contract(): string {
    let value = this.get("contract");
    return value.toString();
  }

  set contract(value: string) {
    this.set("contract", Value.fromString(value));
  }
}
