import hre from "hardhat";

async function main() {
    const network = hre.network.name;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS not set in environment variables");
    }

    console.log(`\n🔗 Interacting with Pepasur contract on ${network}...`);
    console.log(`📝 Contract address: ${contractAddress}`);

    // Get contract instance
    const Pepasur = await hre.ethers.getContractFactory("Pepasur");
    const pepasur = Pepasur.attach(contractAddress);

    // Get contract info
    console.log("\n📊 Contract Information:");

    const admin = await pepasur.admin();
    console.log(`   Admin: ${admin}`);

    const serverSigner = await pepasur.serverSigner();
    console.log(`   Server Signer: ${serverSigner}`);

    const feeRecipient = await pepasur.feeRecipient();
    console.log(`   Fee Recipient: ${feeRecipient}`);

    const houseCutBps = await pepasur.houseCutBps();
    console.log(`   House Cut: ${houseCutBps} bps (${Number(houseCutBps) / 100}%)`);

    const nextGameId = await pepasur.nextGameId();
    console.log(`   Next Game ID: ${nextGameId}`);

    // Get account info
    const [signer] = await hre.ethers.getSigners();
    console.log(`\n👤 Your Account:`);
    console.log(`   Address: ${signer.address}`);

    const balance = await hre.ethers.provider.getBalance(signer.address);
    console.log(`   Balance: ${hre.ethers.formatEther(balance)} ${network === 'celo' || network === 'celoAlfajores' || network === 'celoSepolia' ? 'CELO' : network === 'u2u' || network === 'u2uTestnet' ? 'U2U' : 'ETH'}`);

    const pendingWithdrawal = await pepasur.pendingWithdrawals(signer.address);
    console.log(`   Pending Withdrawal: ${hre.ethers.formatEther(pendingWithdrawal)} ${network === 'celo' || network === 'celoAlfajores' || network === 'celoSepolia' ? 'CELO' : network === 'u2u' || network === 'u2uTestnet' ? 'U2U' : 'ETH'}`);

    console.log("\n✨ Done!\n");
}

// Execute interaction
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Interaction failed:");
        console.error(error);
        process.exit(1);
    });
