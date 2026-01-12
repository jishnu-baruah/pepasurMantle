/**
 * Backend Mainnet Readiness Test
 * Tests all critical backend components before mainnet deployment
 */

require('dotenv').config();
const { ethers } = require('ethers');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
}

function logTest(name, passed, details = '') {
    const symbol = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${symbol} ${name}`, color);
    if (details) {
        console.log(`   ${details}`);
    }
}

async function testEnvironmentVariables() {
    logSection('1. Environment Variables Check');

    const requiredVars = [
        'NETWORK_NAME',
        'CHAIN_ID',
        'RPC_URL',
        'SERVER_PRIVATE_KEY',
        'ADMIN_PRIVATE_KEY',
        'CONTRACT_ADDRESS',
        'CONTRACT_ABI_PATH',
        'ALLOWED_ORIGINS',
        'PORT'
    ];

    const criticalVars = [
        'SERVER_PRIVATE_KEY',
        'ADMIN_PRIVATE_KEY',
        'CONTRACT_ADDRESS'
    ];

    let allPresent = true;
    let criticalPresent = true;

    for (const varName of requiredVars) {
        const value = process.env[varName];
        const isPresent = !!value;
        const isCritical = criticalVars.includes(varName);

        if (!isPresent) {
            allPresent = false;
            if (isCritical) criticalPresent = false;
        }

        // Mask sensitive values
        let displayValue = value;
        if (varName.includes('PRIVATE_KEY') && value) {
            displayValue = value.substring(0, 6) + '...' + value.substring(value.length - 4);
        }

        logTest(
            `${varName}`,
            isPresent,
            isPresent ? displayValue : 'MISSING'
        );
    }

    // Check for placeholder values
    const hasPlaceholders =
        process.env.SERVER_PRIVATE_KEY?.includes('your_') ||
        process.env.ADMIN_PRIVATE_KEY?.includes('your_') ||
        process.env.CONTRACT_ADDRESS?.includes('0x_');

    if (hasPlaceholders) {
        logTest('No placeholder values', false, 'Found placeholder values - update with real values!');
        criticalPresent = false;
    } else {
        logTest('No placeholder values', true);
    }

    return criticalPresent;
}

async function testNetworkConfiguration() {
    logSection('2. Network Configuration Check');

    const networkName = process.env.NETWORK_NAME;
    const chainId = parseInt(process.env.CHAIN_ID);
    const rpcUrl = process.env.RPC_URL;

    // Verify network matches Celo mainnet
    const isCeloMainnet = networkName === 'celo' && chainId === 42220;
    logTest(
        'Network is Celo Mainnet',
        isCeloMainnet,
        `Network: ${networkName}, Chain ID: ${chainId}`
    );

    // Test RPC connection
    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();

        logTest(
            'RPC connection successful',
            true,
            `Connected to chain ID: ${network.chainId}`
        );

        const chainIdMatches = Number(network.chainId) === chainId;
        logTest(
            'Chain ID matches configuration',
            chainIdMatches,
            `Expected: ${chainId}, Got: ${network.chainId}`
        );

        return isCeloMainnet && chainIdMatches;
    } catch (error) {
        logTest('RPC connection', false, error.message);
        return false;
    }
}

async function testWalletConfiguration() {
    logSection('3. Wallet Configuration Check');

    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

        // Test server wallet
        const serverWallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, provider);
        logTest('Server wallet loaded', true, `Address: ${serverWallet.address}`);

        const serverBalance = await provider.getBalance(serverWallet.address);
        const serverBalanceCELO = ethers.formatEther(serverBalance);
        const hasServerBalance = parseFloat(serverBalanceCELO) > 0.1;

        logTest(
            'Server wallet has sufficient balance',
            hasServerBalance,
            `Balance: ${serverBalanceCELO} CELO (minimum 0.1 CELO recommended)`
        );

        // Test admin wallet
        const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        logTest('Admin wallet loaded', true, `Address: ${adminWallet.address}`);

        const adminBalance = await provider.getBalance(adminWallet.address);
        const adminBalanceCELO = ethers.formatEther(adminBalance);

        logTest(
            'Admin wallet balance',
            true,
            `Balance: ${adminBalanceCELO} CELO`
        );

        return hasServerBalance;
    } catch (error) {
        logTest('Wallet configuration', false, error.message);
        return false;
    }
}

async function testContractConfiguration() {
    logSection('4. Contract Configuration Check');

    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const contractAddress = process.env.CONTRACT_ADDRESS;

        // Check if contract exists
        const code = await provider.getCode(contractAddress);
        const contractExists = code !== '0x';

        logTest(
            'Contract exists at address',
            contractExists,
            `Address: ${contractAddress}`
        );

        if (!contractExists) {
            return false;
        }

        // Load and verify ABI
        const contractArtifact = require(`./${process.env.CONTRACT_ABI_PATH}`);
        const contractABI = contractArtifact.abi || contractArtifact;

        logTest('Contract ABI loaded', true, `Functions: ${contractABI.length}`);

        // Initialize contract
        const serverWallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(contractAddress, contractABI, serverWallet);

        // Test contract reads
        try {
            const gameCounter = await contract.gameCounter();
            logTest('Contract is readable', true, `Game counter: ${gameCounter}`);

            const serverSigner = await contract.serverSigner();
            logTest(
                'Server signer configured',
                serverSigner.toLowerCase() === serverWallet.address.toLowerCase(),
                `Server signer: ${serverSigner}`
            );

            const feeRecipient = await contract.feeRecipient();
            logTest('Fee recipient configured', true, `Fee recipient: ${feeRecipient}`);

            return true;
        } catch (error) {
            logTest('Contract interaction', false, error.message);
            return false;
        }
    } catch (error) {
        logTest('Contract configuration', false, error.message);
        return false;
    }
}

async function testGameSettings() {
    logSection('5. Game Settings Check');

    const settings = {
        'DEFAULT_NIGHT_PHASE_DURATION': process.env.DEFAULT_NIGHT_PHASE_DURATION || '30',
        'DEFAULT_RESOLUTION_PHASE_DURATION': process.env.DEFAULT_RESOLUTION_PHASE_DURATION || '10',
        'DEFAULT_TASK_PHASE_DURATION': process.env.DEFAULT_TASK_PHASE_DURATION || '30',
        'DEFAULT_VOTING_PHASE_DURATION': process.env.DEFAULT_VOTING_PHASE_DURATION || '10',
        'DEFAULT_MAX_TASK_COUNT': process.env.DEFAULT_MAX_TASK_COUNT || '4',
        'DEFAULT_STAKE_AMOUNT': process.env.DEFAULT_STAKE_AMOUNT || '100000000000000000',
        'DEFAULT_MIN_PLAYERS': process.env.DEFAULT_MIN_PLAYERS || '4',
        'DEFAULT_MAX_PLAYERS': process.env.DEFAULT_MAX_PLAYERS || '10',
        'GAME_TIMEOUT_SECONDS': process.env.GAME_TIMEOUT_SECONDS || '300'
    };

    for (const [key, value] of Object.entries(settings)) {
        logTest(key, true, value);
    }

    // Validate stake amount is reasonable for mainnet
    const stakeAmount = ethers.formatEther(settings.DEFAULT_STAKE_AMOUNT);
    const isReasonable = parseFloat(stakeAmount) >= 0.01 && parseFloat(stakeAmount) <= 1;

    logTest(
        'Stake amount is reasonable',
        isReasonable,
        `${stakeAmount} CELO (recommended: 0.01 - 1 CELO)`
    );

    return isReasonable;
}

async function testCORSConfiguration() {
    logSection('6. CORS Configuration Check');

    const allowedOrigins = process.env.ALLOWED_ORIGINS || '';
    const origins = allowedOrigins.split(',').map(o => o.trim());

    logTest('CORS origins configured', origins.length > 0);

    for (const origin of origins) {
        const isProduction = origin.includes('https://') && !origin.includes('localhost');
        logTest(
            `Origin: ${origin}`,
            true,
            isProduction ? 'Production URL' : 'Development URL'
        );
    }

    const hasProductionOrigin = origins.some(o => o.includes('https://') && !o.includes('localhost'));
    logTest('Has production origin', hasProductionOrigin);

    return hasProductionOrigin;
}

async function testMongoDBConfiguration() {
    logSection('7. MongoDB Configuration Check');

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        logTest('MongoDB URI', false, 'Not configured (optional but recommended)');
        return true; // Not critical
    }

    const isProduction = mongoUri.includes('mongodb+srv://') ||
        (!mongoUri.includes('localhost') && !mongoUri.includes('127.0.0.1'));

    logTest(
        'MongoDB URI configured',
        true,
        isProduction ? 'Production database' : 'Local database'
    );

    logTest(
        'Using production database',
        isProduction,
        isProduction ? 'Good for mainnet' : 'Consider using production MongoDB'
    );

    return true;
}

async function runAllTests() {
    log('\n🚀 PEPASUR BACKEND MAINNET READINESS TEST', 'blue');
    log('Testing backend configuration for Celo Mainnet deployment\n', 'blue');

    const results = {
        env: await testEnvironmentVariables(),
        network: await testNetworkConfiguration(),
        wallet: await testWalletConfiguration(),
        contract: await testContractConfiguration(),
        settings: await testGameSettings(),
        cors: await testCORSConfiguration(),
        mongodb: await testMongoDBConfiguration()
    };

    logSection('FINAL RESULTS');

    const allPassed = Object.values(results).every(r => r === true);
    const criticalPassed = results.env && results.network && results.wallet && results.contract;

    log('\nTest Summary:', 'cyan');
    for (const [test, passed] of Object.entries(results)) {
        logTest(test.toUpperCase(), passed);
    }

    console.log('\n' + '='.repeat(60));

    if (allPassed) {
        log('✅ ALL TESTS PASSED - READY FOR MAINNET DEPLOYMENT!', 'green');
    } else if (criticalPassed) {
        log('⚠️  CRITICAL TESTS PASSED - Some optional configurations need attention', 'yellow');
    } else {
        log('❌ CRITICAL TESTS FAILED - DO NOT DEPLOY TO MAINNET', 'red');
    }

    console.log('='.repeat(60) + '\n');

    return allPassed;
}

// Run tests
runAllTests()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        log(`\n❌ Test execution failed: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
