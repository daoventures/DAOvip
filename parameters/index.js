module.exports = {
  mainnet: {
    Global: {
      proxyAdmin: "0x59E83877bD248cBFe392dbB5A8a29959bcb48592",  // TODO: Update with correct value
      treasuryWalletAddr: "0x59E83877bD248cBFe392dbB5A8a29959bcb48592",  // TODO: Update with correct value
      uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    },
    DVD: {
      tokenAddress: "0x77dcE26c03a9B833fc2D7C31C22Da4f42e9d9582",
      vaultAddress: "0xcab7a9239b94a51908d6CF522cE72B5Be5058402",  // This is used only hardhat test, no needed for deployment
    },
    xDVD: {
      tokenAddress: "0x1193c036833B0010fF80a3617BBC94400A284338",
      proxyAdmin: "0xA1b0176B24cFB9DB3AEe2EDf7a6DF129B69ED376",
      ownerAddress: "0xA1b0176B24cFB9DB3AEe2EDf7a6DF129B69ED376",
    },
  },
  kovan: {
    Global: {
      proxyAdmin: "0x891F4bDc41455CD2491B6950c1A2Ab46021Dd647",  // TODO: Update with correct value
      treasuryWalletAddr: "0xA1b0176B24cFB9DB3AEe2EDf7a6DF129B69ED376",  // TODO: Update with correct value
      uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    },
    DVD: {
      tokenAddress: "0x6639c554A299D58284e36663f609a7d94526fEC0",
    },
    xDVD: {
      tokenAddress: "0x4bb18f377a9D2dD62a6af7D78f6e7673E0e0f648",
      proxyAdmin: "0x891F4bDc41455CD2491B6950c1A2Ab46021Dd647",
      ownerAddress: "0xA1b0176B24cFB9DB3AEe2EDf7a6DF129B69ED376",
    },
  },
};
