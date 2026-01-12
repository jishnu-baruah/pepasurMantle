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
        // U2U Network Mainnet
        u2u: {
            url: process.env.U2U_RPC_URL || "https://rpc-mainnet.uniultra.xyz",
            chainId: 39,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            gasPrice: "auto",
        },
        // U2U Network Testnet (if available)
        u2uTestnet: {
            url: process.env.U2U_TESTNET_RPC_URL || "https://rpc-nebulas-testnet.uniultra.xyz",
            chainId: 2484,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            gasPrice: "auto",
        },
        // Celo Mainnet
        celo: {
            url: process.env.CELO_RPC_URL || "https://forno.celo.org",
            chainId: 42220,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            gasPrice: "auto",
        },
        // Celo Alfajores Testnet
        celoAlfajores: {
            url: process.env.CELO_ALFAJORES_RPC_URL || "https://alfajores-forno.celo-testnet.org",
            chainId: 44787,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            gasPrice: "auto",
        },
        // Celo Sepolia Testnet
        celoSepolia: {
            url: process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org",
            chainId: 11142220,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            gasPrice: "auto",
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
            // U2U Network (if block explorer API is available)
            u2u: process.env.U2U_EXPLORER_API_KEY || "not-needed",
            // Celo
            celo: process.env.CELO_EXPLORER_API_KEY || "not-needed",
            celoAlfajores: process.env.CELO_EXPLORER_API_KEY || "not-needed",
        },
        customChains: [
            {
                network: "u2u",
                chainId: 39,
                urls: {
                    apiURL: "https://u2uscan.xyz/api",
                    browserURL: "https://u2uscan.xyz",
                },
            },
            {
                network: "celo",
                chainId: 42220,
                urls: {
                    apiURL: "https://explorer.celo.org/api",
                    browserURL: "https://explorer.celo.org",
                },
            },
            {
                network: "celoAlfajores",
                chainId: 44787,
                urls: {
                    apiURL: "https://alfajores.celoscan.io/api",
                    browserURL: "https://alfajores.celoscan.io",
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
