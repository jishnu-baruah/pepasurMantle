import hre from "hardhat";

async function main() {
    const network = hre.network.name;
    console.log(`\n🔧 Initializing Pepasur contract on ${network}...`);

    // Get contract address from environment or command line
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS not set in environment variables");
    }

    console.log(`📝 Contract address: ${contractAddress}`);

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log(`📝 Initializing with account: ${deployer.address}`);

    // Get contract instance
    const Pepasur = await hre.ethers.getContractFactory("Pepasur");
    const pepasur = Pepasur.attach(contractAddress);

    // Get initialization parameters from environment
    const serverSigner = process.env.SERVER_SIGNER_ADDRESS || deployer.address;
    const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS || deployer.address;

    console.log(`\n📋 Initialization Parameters:`);
    console.log(`   Server Signer: ${serverSigner}`);
    console.log(`   Fee Recipient: ${feeRecipient}`);

    // Initialize contract
    console.log("\n⏳ Sending initialization transaction...");
    const tx = await pepasur.initialize(serverSigner, feeRecipient);
    console.log(`📝 Transaction hash: ${tx.hash}`);

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Verify initialization
    console.log("\n🔍 Verifying initialization...");
    const admin = await pepasur.admin();
    const actualServerSigner = await pepasur.serverSigner();
    const actualFeeRecipient = await pepasur.feeRecipient();
    const houseCutBps = await pepasur.houseCutBps();

    console.log(`\n✅ Contract Initialized:`);
    console.log(`   Admin: ${admin}`);
    console.log(`   Server Signer: ${actualServerSigner}`);
    console.log(`   Fee Recipient: ${actualFeeRecipient}`);
    console.log(`   House Cut: ${houseCutBps} bps (${Number(houseCutBps) / 100}%)`);

    console.log("\n✨ Initialization complete!\n");
}

// Execute initialization
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Initialization failed:");
        console.error(error);
        process.exit(1);
    });
