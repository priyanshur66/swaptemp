"use client";

import { useBlockchain } from '@/lib/blockchain-context';
import { Button } from '@/components/ui/button';

const WalletConnect = () => {
  const { 
    isConnected, 
    account, 
    connectWallet, 
    disconnectWallet 
  } = useBlockchain();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {isConnected ? (
        <>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="px-3 py-2 h-auto"
            >
              {formatAddress(account)}
            </Button>
            
            <Button
              onClick={disconnectWallet}
              variant="destructive"
              size="sm"
              className="px-3 py-2 h-auto"
            >
              Disconnect
            </Button>
          </div>
        </>
      ) : (
        <Button
          onClick={connectWallet}
          className="px-3 py-2 h-auto"
        >
          Connect Wallet
        </Button>
      )}
    </div>
  );
};

export default WalletConnect; 