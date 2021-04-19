# xDVG (VIP DVG)

### The smart contracts are still under development (testing and auditing) and we strongly advise anyone not to deposit anything on the mainnet until we publicly launch the product.



## Introduction

### What's that?

*xDVG (VIP DVG)* is an ERC20 token that you receive in exchange for staking DVG tokens. The xDVG token is always worth more than a regular DVG token. 

### Where do staking rewards come from?

*DVGUniBot* will buy back DVG from UniswapV2, using funds in Treasury wallet or Community wallet, and then send DVG tokens to xDVG smart contract. In the future, we will develop more strategy smart contracts to buy back DVG from more exchanges/swaps.

### Why is my xDVG balance lower than my DVG balance?

When you stake your DVG tokens, you “purchase” a share of the xDVG pool. Because xDVG appreciates in value compared to DVG, the amount of xDVG you get for your DVG decreases overtime.



## Functions

### xDVG (VIP DVG)

##### function `deposit(uint256 _amount)`

Pay some DVGs. Earn some shares. Locks DVG and mints xDVG.

#### function `withdraw(uint256 _share)`

Claim back your DVGs. Unclocks the staked + gained DVG and burns xDVG.


### DVGUniBot

#### User function

#### function `buyDVG(IERC20 _token)`

Ask this smart contract to buy back DVG from UniswapV2, using funds in Treasury wallet or Community wallet, and then send DVG tokens to xDVG smart contract.

#### Admin functions

#### function `setWallet(address _wallet)`

Set the wallet address, we will spend its funds to buy back DVG.

#### function `setAmount(uint256 _minAmount, uint256 _amount)`

Set two amounts:

- `_minAmount`: the minimum amount of funds in the wallet, only when the amount of funds in the wallet is larger than this minimum amount, can we buy back DVG.
- `_amount`: the amount of funds that we will use to buy back DVG.

#### function `setToken(IERC20 _token, bool _allowed, uint256 _decimals)`

- Set the token in the wallet that we could use to buy back DVG.



## Development 

### Create an .env file

Create an .env file within the folder. It should have these fields:

`KOVAN_URL`, `MAINNET_URL`, `ACCOUNT`, `PRIVATE_KEY`, `ETHERSCAN_API_KEY`, `WALLET_ADDRESS`


### Compile

```

npx hardhat compile

```

### Deploy

```

npx hardhat deploy --network \<network name> --tags hardhat\_\<network>_deploy

```

