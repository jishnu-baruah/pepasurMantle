# Pepasur Frontend

A Next.js-based frontend application for Pepasur, an on-chain Mafia game built on EVM-compatible blockchains (U2U Network and Celo). The frontend provides an immersive real-time gaming experience with wallet integration, responsive design, and seamless blockchain interactions.

---

## ✨ Features

- **EVM Wallet Integration**: Support for MetaMask, WalletConnect, and other EVM-compatible wallets
- **Multi-Network Support**: Configurable for U2U Network and Celo via environment variables
- **Real-time UI**: Live game updates via Socket.IO for instant player actions and state changes
- **Responsive Design**: Mobile-first design that works seamlessly across all devices
- **Component-Based Architecture**: Built with shadcn/ui components using Radix UI primitives
- **Game State Management**: Centralized state management using React Context API and custom hooks
- **Sound Effects and Animations**: Immersive audio feedback and smooth animations with Framer Motion
- **Task Mini-games**: Interactive mini-games during task phases
- **Role-Based UI**: Dynamic interface adapting to player roles (ASUR, DEV, MANAV, RISHI)
- **Chat System**: Real-time in-game chat for player communication
- **Transaction Management**: Seamless EVM blockchain transaction handling with wagmi and viem

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4
- **Language**: TypeScript 5
- **UI Library**: React 18.2.0
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 4.1.9
- **State Management**: React Hooks & Context API
- **Blockchain Integration**: wagmi 2.x (React hooks for Ethereum)
- **Ethereum Library**: viem 2.x (TypeScript interface for Ethereum)
- **Wallet Connectors**: MetaMask, WalletConnect, and other EVM wallets
- **Real-time Communication**: socket.io-client 4.8.1
- **Forms**: react-hook-form 7.60.0
- **Validation**: zod 3.25.67
- **Animations**: framer-motion 12.23.22
- **Audio**: howler 2.2.4
- **Icons**: lucide-react 0.454.0
- **Utilities**: clsx 2.1.1, tailwind-merge 2.5.5

---

## 🚀 Getting Started

### Prerequisites

- **Node.js v18 or higher**: JavaScript runtime
- **npm or pnpm**: Package manager
- **EVM Wallet**: Browser extension (MetaMask) or WalletConnect-compatible wallet
- **Native Tokens**: U2U or CELO tokens for staking and gas fees

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

Or using pnpm:

```bash
cd frontend
pnpm install
```

### Step 2: Configure Environment Variables

Copy the example environment file:

```bash
copy .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# EVM Blockchain Configuration
NEXT_PUBLIC_NETWORK=u2u
NEXT_PUBLIC_CHAIN_ID=39
NEXT_PUBLIC_RPC_URL=https://rpc-mainnet.uniultra.xyz

# Pepasur Contract Address (deployed contract address on EVM)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# Network Display
NEXT_PUBLIC_NETWORK_NAME=U2U Network
NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL=U2U
NEXT_PUBLIC_EXPLORER_URL=https://u2uscan.xyz

# Game Configuration
NEXT_PUBLIC_DEFAULT_STAKE_AMOUNT=100000000
NEXT_PUBLIC_DEFAULT_MIN_PLAYERS=4
NEXT_PUBLIC_DEFAULT_MAX_PLAYERS=10
NEXT_PUBLIC_GAME_TIMEOUT_SECONDS=300

# Development Configuration (optional)
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=false
```

**Environment Variable Descriptions:**

- `NEXT_PUBLIC_API_URL`: Backend REST API endpoint
- `NEXT_PUBLIC_SOCKET_URL`: Backend Socket.IO server endpoint
- `NEXT_PUBLIC_NETWORK`: Network identifier (u2u or celo)
- `NEXT_PUBLIC_CHAIN_ID`: EVM chain ID (39 for U2U, 42220 for Celo)
- `NEXT_PUBLIC_RPC_URL`: Network RPC endpoint
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: Deployed Pepasur.sol contract address
- `NEXT_PUBLIC_NETWORK_NAME`: Display name for the network
- `NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL`: Native token symbol (U2U or CELO)
- `NEXT_PUBLIC_EXPLORER_URL`: Block explorer URL for transaction links
- `NEXT_PUBLIC_DEFAULT_STAKE_AMOUNT`: Default stake amount in Wei (1 ETH = 10^18 Wei)
- `NEXT_PUBLIC_DEFAULT_MIN_PLAYERS`: Minimum players required to start a game
- `NEXT_PUBLIC_DEFAULT_MAX_PLAYERS`: Maximum players allowed in a game
- `NEXT_PUBLIC_GAME_TIMEOUT_SECONDS`: Game timeout duration in seconds
- `NEXT_PUBLIC_DEV_MODE`: Enable development mode features
- `NEXT_PUBLIC_ENABLE_DEBUG_LOGS`: Enable debug logging in console

### Step 3: Run Development Server

```bash
npm run dev
```

Or using pnpm:

```bash
pnpm dev
```

The application will be available at **http://localhost:3000**

### Build for Production

```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page / game lobby
│   └── globals.css        # Global styles
├── components/             # React components
│   ├── common/            # Shared components (buttons, cards, etc.)
│   ├── game/              # Game-specific components (player list, role cards)
│   ├── screens/           # Game screen components (lobby, night, voting)
│   ├── ui/                # shadcn/ui components (dialog, toast, etc.)
│   └── wallet/            # Wallet integration components
├── contexts/              # React contexts
│   └── SocketContext.tsx  # Socket.IO connection context
├── hooks/                 # Custom React hooks
│   ├── useGame.ts        # Game state management hook
│   ├── useToast.ts       # Toast notification hook
│   └── use-mobile.ts     # Mobile detection hook
├── lib/                   # Utility libraries
│   ├── utils.ts          # Helper functions
│   └── smoothsend.ts     # SmoothSend integration
├── services/              # API and service layers
│   ├── api.ts            # REST API client
│   └── SoundService.ts   # Audio management service
├── styles/                # Global styles
│   └── globals.css       # Tailwind and custom CSS
├── utils/                 # Helper functions
│   ├── playerColors.ts   # Player color assignments
│   ├── sessionPersistence.ts  # Session storage utilities
│   └── winProbability.ts # Win probability calculations
├── public/                # Static assets
│   ├── images/           # Image assets
│   └── video/            # Video assets
├── .env.local             # Environment variables (not committed)
├── next.config.mjs        # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

---

## 🔌 Key Integrations

### EVM Wallet Integration

The frontend uses **wagmi** and **viem** to support EVM-compatible wallets including MetaMask, WalletConnect, and others. The wallet integration provides:

- **Multi-wallet Support**: Users can connect with MetaMask, WalletConnect, or other EVM wallets
- **Account Management**: Access to connected wallet address and account information
- **Transaction Signing**: Sign and submit transactions to EVM blockchains
- **Network Switching**: Automatic network detection and switching prompts
- **Contract Interactions**: Type-safe contract calls using wagmi hooks

**Implementation:**
```typescript
import { WagmiConfig, createConfig } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

// Configure wagmi with target chain
const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({ chains, options: { projectId } }),
  ],
  publicClient,
});

// Wrap your app with the provider
<WagmiConfig config={config}>
  {children}
</WagmiConfig>
```

**Contract Interaction Hooks:**
```typescript
import { useContractRead, useContractWrite } from 'wagmi';
import { parseEther } from 'viem';

// Read contract state
const { data: gameInfo } = useContractRead({
  address: contractAddress,
  abi: PepasurABI,
  functionName: 'games',
  args: [gameId],
});

// Write to contract (join game)
const { write: joinGame } = useContractWrite({
  address: contractAddress,
  abi: PepasurABI,
  functionName: 'joinGame',
  args: [gameId],
  value: parseEther(stakeAmount.toString()),
});
```

### Real-time Communication

Socket.IO client maintains a persistent connection to the backend for live game updates, player actions, and chat functionality. The `SocketContext` provides:

- **Connection Management**: Automatic reconnection and error handling
- **Event Listeners**: Subscribe to game state updates and player actions
- **Event Emitters**: Send player actions and chat messages to server
- **Room Management**: Join and leave game rooms dynamically

**Key Events:**
- `game_state`: Full game state updates
- `game_update`: Incremental state changes
- `task_update`: Task submission updates
- `chat_message`: Real-time chat messages
- `error`: Error notifications

### State Management

Game state is managed through React Context API and custom hooks, providing centralized state access across components:

- **SocketContext**: Manages Socket.IO connection and real-time events
- **useGame Hook**: Provides game state, player information, and game actions
- **useToast Hook**: Manages toast notifications for user feedback

**Example Usage:**
```typescript
import { useGame } from '@/hooks/useGame';

const { gameState, players, currentPhase, submitAction } = useGame();
```

### Blockchain Interactions

The frontend interacts with EVM blockchains through wagmi and viem:

- **Game Creation**: Backend creates games on-chain, frontend receives game ID
- **Joining Games**: Users stake native tokens (U2U/CELO) to join games via payable contract calls
- **Withdrawals**: Users withdraw winnings from completed games directly from contract
- **Transaction Status**: Monitor transaction status and confirmations via wagmi hooks
- **Network Detection**: Automatic detection of connected network and prompts to switch if incorrect

---

## 🎮 Game Screens

The application includes multiple game screens that adapt to the current game phase:

- **Lobby Screen**: Create or join games, view player list, configure game settings
- **Night Phase Screen**: Role-specific actions (eliminate, protect, investigate)
- **Task Phase Screen**: Complete mini-games for bonus rewards
- **Voting Phase Screen**: Vote to eliminate suspected Mafia players
- **Resolution Screen**: View elimination results and game outcomes
- **Game Over Screen**: Display winners and reward distribution

---

## 🎨 Styling and Theming

The application uses Tailwind CSS for styling with a custom design system:

- **Color Palette**: Custom color scheme for game roles and UI elements
- **Typography**: Geist font family for modern, clean text
- **Dark Mode**: Full dark mode support with next-themes
- **Responsive Breakpoints**: Mobile-first responsive design
- **Animations**: Smooth transitions and animations with Tailwind and Framer Motion

---

## 🔊 Audio System

The `SoundService` manages all game audio:

- **Background Music**: Ambient music during gameplay
- **Sound Effects**: Action feedback, notifications, and UI interactions
- **Volume Control**: User-configurable volume settings
- **Audio Preloading**: Efficient audio asset loading

---

## 🧪 Development

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build production-optimized application
- `npm start`: Start production server
- `npm run lint`: Run ESLint for code quality checks

### Code Quality

The project uses:
- **TypeScript**: Type safety and better developer experience
- **ESLint**: Code linting with Next.js recommended rules
- **Prettier**: Code formatting (configure as needed)

---

## 🌐 Network-Specific Configuration

### U2U Network

Create `.env.u2u` file:
```env
NEXT_PUBLIC_NETWORK=u2u
NEXT_PUBLIC_CHAIN_ID=39
NEXT_PUBLIC_RPC_URL=https://rpc-mainnet.uniultra.xyz
NEXT_PUBLIC_CONTRACT_ADDRESS=<your_deployed_contract>
NEXT_PUBLIC_NETWORK_NAME=U2U Network
NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL=U2U
NEXT_PUBLIC_EXPLORER_URL=https://u2uscan.xyz
NEXT_PUBLIC_API_URL=https://api.u2u.pepasur.xyz
```

### Celo Network

Create `.env.celo` file:
```env
NEXT_PUBLIC_NETWORK=celo
NEXT_PUBLIC_CHAIN_ID=42220
NEXT_PUBLIC_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_CONTRACT_ADDRESS=<your_deployed_contract>
NEXT_PUBLIC_NETWORK_NAME=Celo
NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL=CELO
NEXT_PUBLIC_EXPLORER_URL=https://explorer.celo.org
NEXT_PUBLIC_API_URL=https://api.celo.pepasur.xyz
```

### Switching Networks

To switch between networks, copy the appropriate environment file:
```bash
# For U2U
copy .env.u2u .env.local

# For Celo
copy .env.celo .env.local
```

Then rebuild the application:
```bash
npm run build
```

## 🐛 Troubleshooting

### Wallet Connection Issues

- Ensure you have MetaMask or a WalletConnect-compatible wallet installed
- Check that your wallet is connected to the correct network (U2U or Celo)
- Try refreshing the page or reconnecting your wallet
- If prompted, add the custom network to your wallet

### Wrong Network

- The app will prompt you to switch networks if you're on the wrong chain
- Click "Switch Network" in the prompt to automatically switch
- If the network isn't added to your wallet, you'll be prompted to add it

### Socket Connection Errors

- Verify the backend server is running at the configured `NEXT_PUBLIC_SOCKET_URL`
- Check browser console for connection error messages
- Ensure CORS is properly configured on the backend

### Transaction Failures

- Confirm you have sufficient native tokens (U2U/CELO) for staking and gas fees
- Verify the contract address in `.env.local` matches the deployed contract
- Check the block explorer for transaction details and error messages
- Ensure you're on the correct network

### Build Errors

- Delete `.next` folder and `node_modules`, then reinstall dependencies
- Ensure all environment variables are properly set
- Check for TypeScript errors with `npm run lint`
- Verify wagmi and viem versions are compatible

---

## 📚 Additional Resources

- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **wagmi Documentation**: [https://wagmi.sh/](https://wagmi.sh/)
- **viem Documentation**: [https://viem.sh/](https://viem.sh/)
- **U2U Network Documentation**: [https://docs.uniultra.xyz/](https://docs.uniultra.xyz/)
- **Celo Documentation**: [https://docs.celo.org/](https://docs.celo.org/)
- **shadcn/ui Components**: [https://ui.shadcn.com/](https://ui.shadcn.com/)
- **Tailwind CSS**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Socket.IO Client**: [https://socket.io/docs/v4/client-api/](https://socket.io/docs/v4/client-api/)
- **MetaMask Documentation**: [https://docs.metamask.io/](https://docs.metamask.io/)
- **WalletConnect Documentation**: [https://docs.walletconnect.com/](https://docs.walletconnect.com/)

---

## 🤝 Contributing

Contributions are welcome! Please ensure your code follows the project's coding standards and includes appropriate documentation.

---

## 📄 License

MIT
