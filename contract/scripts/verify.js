import hre from "hardhat";

async function main() {
    const network = hre.network.name;

    // Get contract address from environment or command line
    const contractAddress = process.env.CONTRACT_ADDRESS || process.argv[2];

    if (!contractAddress) {
        throw new Error("Please provide CONTRACT_ADDRESS in environment or as argument");
    }

    console.log(`\n🔍 Verifying Pepasur contract on ${network}...`);
    console.log(`📝 Contract address: ${contractAddress}`);

    try {
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: [],
        });

        console.log("\n✅ Contract verified successfully!\n");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("\n✅ Contract is already verified!\n");
        } else {
            throw error;
        }
    }
}

// Execute verification
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Verification failed:");
        console.error(error);
        process.exit(1);
    });
