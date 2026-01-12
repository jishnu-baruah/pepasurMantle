import hre from "hardhat";

async function main() {
    const network = hre.network.name;
    console.log(`\n🚀 Deploying Pepasur contract to ${network}...`);

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log(`📝 Deploying with account: ${deployer.address}`);

    // Get deployer balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ${network === 'celo' || network === 'celoAlfajores' || network === 'celoSepolia' ? 'CELO' : network === 'u2u' || network === 'u2uTestnet' ? 'U2U' : 'ETH'}`);

    // Deploy Pepasur contract
    console.log("\n📦 Deploying Pepasur contract...");
    const Pepasur = await hre.ethers.getContractFactory("Pepasur");
    const pepasur = await Pepasur.deploy();

    await pepasur.waitForDeployment();
    const contractAddress = await pepasur.getAddress();

    console.log(`✅ Pepasur deployed to: ${contractAddress}`);

    // Wait for a few block confirmations before verification
    if (network !== "hardhat" && network !== "localhost") {
        console.log("\n⏳ Waiting for block confirmations...");
        await pepasur.deploymentTransaction().wait(5);
        console.log("✅ Block confirmations received");
    }

    // Display next steps
    console.log("\n📋 Next Steps:");
    console.log("1. Initialize the contract with:");
    console.log(`   npx hardhat run scripts/initialize.js --network ${network}`);
    console.log("\n2. Update your .env file with:");
    console.log(`   CONTRACT_ADDRESS=${contractAddress}`);

    if (network !== "hardhat" && network !== "localhost") {
        console.log("\n3. Verify the contract with:");
        console.log(`   npx hardhat verify --network ${network} ${contractAddress}`);
    }

    console.log("\n✨ Deployment complete!\n");

    return contractAddress;
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
