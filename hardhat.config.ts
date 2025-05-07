import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version:"0.8.28",
    settings:{
      viaIR:true,
    }
  },
  networks:{
    hardhat:{
      chainId:1337
    },
  },
};

export default config;
