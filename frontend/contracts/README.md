# Contract Sample Directory

This directory contains sample contract files that are used as a fallback when the main `contract` folder doesn't exist or is not properly populated.

## Purpose

In development environments, the `contract` folder is auto-generated during deployment with the latest contract addresses. When working locally or in environments where the contract folder isn't generated, this sample folder provides fallback contract information.

## Files

- `AtomicSwapERC20-abi.json`: The ABI (Application Binary Interface) for the AtomicSwap contract
- `AtomicSwapERC20-address.json`: Contains the contract address and network information

The address file includes:
```json
{
    "address": "0xa6Ad218916808deF0E87056d761665e7B231Ee1e",
    "network": "sepolia"
}
```

The `network` property specifies which blockchain network to use when the main contract folder is unavailable. The application will attempt to switch to this network if the user's wallet is connected to a different network.

## Usage

This folder serves as a fallback mechanism. The application will:

1. First try to load contracts from the main `contract` folder
2. If that fails, it will load from this `contract-sample` folder and use the specified network 