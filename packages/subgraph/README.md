# Honeylemon subgraph

Subgraph endpoints:
Queries (HTTP): https://api.thegraph.com/subgraphs/name/dekz/zeroex
Subscriptions (WS): wss://api.thegraph.com/subgraphs/name/dekz/zeroex

Example:

```graphql
{
  users(first: 5) {
    id
    fillsAsTaker {
      id
    }
    fillsAsMaker {
      id
    }
    orders {
      id
    }
  }
  fills(first: 5) {
    id
    makerAssetFilledAmount
    takerAssetFilledAmount
    order {
      makerAssetData
      takerAssetData
    }
  }
}
```
