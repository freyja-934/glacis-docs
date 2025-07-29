---
id: architecture
title: Sol-Airlift Architecture
sidebar_label: Architecture
---

# Sol-Airlift Architecture

Sol-Airlift is designed as a modular, extensible system that integrates multiple cross-chain bridge protocols while maintaining security and efficiency. This page covers the detailed architecture, including program structure, fee mechanisms, and bridge integrations.

## System Overview

Sol-Airlift acts as a middleware layer between user applications and bridge protocols, providing a unified interface for cross-chain token transfers.

```mermaid
graph TB
    subgraph "User Layer"
        UA[User Application]
        SDK[Sol-Airlift SDK]
    end
    
    subgraph "Sol-Airlift Program"
        Main[Main Program Logic]
        FM[Fee Manager]
        TC[Token Config Storage]
        BV[Bridge Validator]
    end
    
    subgraph "Bridge Layer"
        LZ[LayerZero OFT V2]
        WH[Wormhole NTT]
    end
    
    subgraph "Storage Layer"
        GC[Global Config PDA]
        TF[Token Fees PDA]
        LZC[LayerZero Config PDA]
        NTC[NTT Config PDA]
    end
    
    UA --> SDK
    SDK --> Main
    Main --> FM
    Main --> TC
    Main --> BV
    BV --> LZ
    BV --> WH
    
    Main --> GC
    FM --> TF
    TC --> LZC
    TC --> NTC
    
    style Main fill:#9945FF,color:#fff
    style SDK fill:#14F195,color:#000
```

## Program Structure

The Sol-Airlift program is built using the Anchor framework and consists of several key components:

```mermaid
classDiagram
    class AirliftProgram {
        +initialize_global_config()
        +initialize_layerzero_config()
        +initialize_ntt_config()
        +init_token_fees_config()
        +update_token_fees_config()
        +add_token_config()
        +transfer_oft()
        +transfer_ntt()
    }
    
    class GlobalConfig {
        +admin: Pubkey
        +fee_recipient: Pubkey
        +bump: u8
    }
    
    class TokenConfig {
        +token_type: TokenType
        +mint: Pubkey
        +program_id: Pubkey
        +config_index: u16
        +mint_index: u16
    }
    
    class FeeConfig {
        +value_amount: u64
        +token_amount: u64
        +take_token_bps: u16
        +is_zero: bool
    }
    
    class BridgeConfig {
        +chain_mappings: HashMap
        +gmp_mappings: HashMap
    }
    
    AirliftProgram --> GlobalConfig
    AirliftProgram --> TokenConfig
    AirliftProgram --> FeeConfig
    AirliftProgram --> BridgeConfig
```

### Key Instructions

1. **Configuration Instructions**
   - `initialize_global_config`: Sets up the program admin and fee recipient
   - `initialize_layerzero_config`: Configures LayerZero-specific settings
   - `initialize_ntt_config`: Configures Wormhole NTT settings
   - `init_token_fees_config`: Creates token-specific fee configurations
   - `update_token_fees_config`: Updates existing fee configurations

2. **Token Management**
   - `add_token_config`: Registers new tokens for cross-chain transfers
   - Supports both LayerZero OFT and Wormhole NTT tokens

3. **Transfer Instructions**
   - `transfer_oft`: Executes LayerZero OFT transfers
   - `transfer_ntt`: Executes Wormhole NTT transfers

## Fee Flow Architecture

Sol-Airlift implements a sophisticated fee system that allows for flexible fee collection and distribution:

```mermaid
sequenceDiagram
    participant User
    participant SDK
    participant Airlift
    participant FeeManager
    participant Bridge
    participant FeeRecipient
    
    User->>SDK: Initiate Transfer
    SDK->>Airlift: Send Transfer Instruction
    
    alt Token has specific fee config
        Airlift->>FeeManager: Load Token Fee Config
    else Use global fee config
        Airlift->>FeeManager: Load Global Fee Config
    end
    
    FeeManager->>FeeManager: Calculate Fees
    Note over FeeManager: BPS: amount * bps / 10000<br/>Fixed: configured amounts
    
    Airlift->>User: Deduct Fee Amount
    Airlift->>FeeRecipient: Transfer Fees
    Airlift->>Bridge: Execute Bridge Transfer
    
    Bridge-->>User: Tokens on Destination Chain
```

### Fee Calculation Methods

1. **Basis Points (BPS)**: Percentage-based fees
   - Formula: `fee = transferAmount * takeTokenBps / 10000`
   - Example: 50 BPS = 0.5% fee

2. **Fixed Fees**: Static amounts
   - `valueAmount`: Fee in SOL (lamports)
   - `tokenAmount`: Fee in transfer token

3. **Zero Fees**: Special configuration for fee-exempt tokens

## Bridge Integration Architecture

Sol-Airlift integrates with bridge protocols through Cross-Program Invocations (CPIs):

```mermaid
graph TD
    subgraph "Transaction Context"
        User[User Transaction]
        AI[Sol-Airlift Instruction]
        BI[Bridge Instruction]
    end
    
    subgraph "Sol-Airlift Execution"
        V[Validate Accounts]
        F[Calculate Fees]
        C[Collect Fees]
        P[Prepare Bridge Call]
    end
    
    subgraph "Bridge Execution"
        LZ[LayerZero OFT Send]
        NT[Wormhole NTT Transfer]
    end
    
    User --> AI
    User --> BI
    AI --> V
    V --> F
    F --> C
    C --> P
    P -.CPI.-> LZ
    P -.CPI.-> NT
    
    style AI fill:#9945FF,color:#fff
    style V fill:#e3f2fd
    style F fill:#e3f2fd
    style C fill:#e3f2fd
    style P fill:#e3f2fd
```

### LayerZero Integration

For LayerZero OFT transfers, Sol-Airlift uses instruction introspection to validate that the bridge instruction is included in the same transaction:

```mermaid
flowchart LR
    A[Transaction] --> B{Contains OFT Send?}
    B -->|Yes| C[Validate Parameters]
    B -->|No| D[Reject Transaction]
    C --> E{Parameters Match?}
    E -->|Yes| F[Execute Transfer]
    E -->|No| D
    F --> G[Collect Fees]
    G --> H[Complete]
    
    style F fill:#e8f5e8
    style D fill:#ffebee
```

### Wormhole NTT Integration

Wormhole NTT integration supports both burn and transfer modes:

```mermaid
graph TD
    Start[NTT Transfer Request] --> Mode{Transfer Mode?}
    
    Mode -->|Burn| Burn[Burn Tokens]
    Mode -->|Transfer| Transfer[Transfer to Escrow]
    
    Burn --> Post[Post VAA Message]
    Transfer --> Post
    
    Post --> Relay[Relay to Destination]
    Relay --> Mint[Mint/Release on Destination]
    
    style Burn fill:#fff3e0
    style Transfer fill:#e3f2fd
    style Mint fill:#e8f5e8
```

## Account Relationships

Sol-Airlift uses Program Derived Addresses (PDAs) for secure account management:

```mermaid
graph TB
    subgraph "Configuration PDAs"
        GC[Global Config<br/>seeds: GLOBAL_CONFIG_SEED]
        LZC[LayerZero Config<br/>seeds: LZ_CONFIG_SEED]
        NTC[NTT Config<br/>seeds: NTT_CONFIG_SEED]
    end
    
    subgraph "Token PDAs"
        TF[Token Fees Config<br/>seeds: TOKEN_FEES_CONFIG_SEED, mint]
        TC[Token Config<br/>seeds: varies by type]
    end
    
    subgraph "User Accounts"
        UA[User Token Account]
        UW[User Wallet]
    end
    
    subgraph "Bridge Accounts"
        BA[Bridge Authority]
        BE[Bridge Escrow]
    end
    
    UW --> GC
    TC --> TF
    UA --> BE
    TC --> BA
    
    style GC fill:#f3e5f5
    style LZC fill:#f3e5f5
    style NTC fill:#f3e5f5
    style TF fill:#e3f2fd
```

### PDA Seeds

- **Global Config**: `[b"GLOBAL_CONFIG"]`
- **LayerZero Config**: `[b"LZ_CONFIG"]`
- **NTT Config**: `[b"NTT_CONFIG"]`
- **Token Fees**: `[b"TOKEN_FEES_CONFIG", mint.key()]`

## Security Architecture

Sol-Airlift implements multiple security layers:

```mermaid
flowchart TB
    subgraph "Input Validation"
        A1[Account Ownership Check]
        A2[Signer Verification]
        A3[PDA Validation]
    end
    
    subgraph "Bridge Validation"
        B1[Instruction Introspection]
        B2[Parameter Matching]
        B3[Amount Verification]
    end
    
    subgraph "Fee Protection"
        C1[Fee Calculation Verification]
        C2[Recipient Validation]
        C3[Overflow Protection]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> C1
    C1 --> C2
    C2 --> C3
    
    style A1 fill:#e8f5e8
    style A2 fill:#e8f5e8
    style A3 fill:#e8f5e8
```

### Security Features

1. **Admin Controls**: Only admin can modify configurations
2. **Instruction Introspection**: Validates bridge instructions in same transaction
3. **Account Validation**: Ensures all accounts are properly owned and initialized
4. **Fee Protection**: Prevents fee manipulation and ensures correct distribution

## Transaction Size Optimization

Sol-Airlift uses Address Lookup Tables (LUTs) to optimize transaction size:

```mermaid
graph LR
    subgraph "Without LUT"
        T1[Transaction<br/>32 accounts<br/>~1400 bytes]
    end
    
    subgraph "With LUT"
        T2[Transaction<br/>LUT + indices<br/>~850 bytes]
    end
    
    T1 -->|40% reduction| T2
    
    style T1 fill:#ffebee
    style T2 fill:#e8f5e8
```

## Performance Considerations

1. **CPI Depth**: LayerZero requires careful management due to Solana's CPI depth limit
2. **Compute Units**: Optimized instruction execution to stay within limits
3. **Transaction Size**: LUTs enable complex operations within size constraints
4. **RPC Optimization**: SDK includes retry logic and load balancing

## Next Steps

- Learn about the [Fee System](../concepts/fee-system) in detail
- Understand [Bridge Integration](../concepts/bridge-integration) specifics
- Explore [Token Configuration](../token-management/overview) options 