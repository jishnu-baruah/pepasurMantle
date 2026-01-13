import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
        },
    },
    networks: {
        // Mantle Sepolia Testnet
        mantleSepolia: {
            url: process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz",
            chainId: 5003,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        // Hardhat local network
        hardhat: {
            chainId: 31337,
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    etherscan: {
        apiKey: {
            // Mantle Sepolia
            mantleSepolia: process.env.MANTLE_EXPLORER_API_KEY || "not-needed",
        },
        customChains: [
            {
                network: "mantleSepolia",
                chainId: 5003,
                urls: {
                    apiURL: "https://explorer.sepolia.mantle.xyz/api",
                    browserURL: "https://explorer.sepolia.mantle.xyz",
                },
            },
        ],
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS === "true",
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
    },
};
