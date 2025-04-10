import { useState } from 'react';
import { ethers } from 'ethers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBlockchain } from '@/lib/blockchain-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";

const Unlock = () => {
  const [tokenAddress, setTokenAddress] = useState(''); // Default to USDT
  const [creator, setCreator] = useState('');
  const [secret, setSecret] = useState('');
  const [timeout, setTimeout] = useState(3600); // 1 hour in seconds
  const [loading, setLoading] = useState(false);
  const [copiedStates, setCopiedStates] = useState({
    secret: false,
    creator: false,
    tokenAddress: false
  });
  const [lastTransaction, setLastTransaction] = useState(null);

  const { unlock, isConnected, isCorrectNetwork, switchToCorrectNetwork } = useBlockchain();

  const copyToClipboard = (text, field) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedStates(prev => ({ ...prev, [field]: true }));
        setTimeout(() => setCopiedStates(prev => ({ ...prev, [field]: false })), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      alert("Please enter a valid token address");
      return;
    }
    
    if (!creator || !ethers.isAddress(creator)) {
      alert("Please enter a valid creator address");
      return;
    }
    
    if (!secret) {
      alert("Please enter the secret");
      return;
    }
    
    try {
      setLoading(true);
      
      // If the secret is in plain text, convert it to bytes32
      let secretBytes;
      if (secret.startsWith('0x') && secret.length === 66) {
        // Already a bytes32 hex string
        secretBytes = secret;
      } else {
        // Convert string to bytes32
        secretBytes = ethers.keccak256(ethers.toUtf8Bytes(secret));
      }
      
      console.log("Submitting unlock transaction with parameters:", {
        tokenAddress,
        creator,
        secret,
        secretBytes,
        timeout: Number(timeout)
      });
      
      const result = await unlock(
        tokenAddress,
        creator,
        secretBytes,
        Number(timeout)
      );
      
      setLastTransaction(result);
    } catch (error) {
      console.error("Error in unlock transaction:", error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to truncate long addresses/values
  const truncate = (str, length = 6) => {
    if (!str) return '';
    if (str.length <= length * 2) return str;
    return `${str.substring(0, length)}...${str.substring(str.length - length)}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Unlock</CardTitle>
        <CardDescription>
          Use this form to unlock tokens that have been locked for you in an atomic swap.
          You'll need the original secret value provided by the counterparty.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="tokenAddress">Token Address (USDT)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    The address of the token contract that was used in the lock.
                    The default is Sepolia USDT.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex space-x-2">
              <Input
                id="tokenAddress"
                placeholder=""
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                required
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => copyToClipboard(tokenAddress, 'tokenAddress')}
                className="whitespace-nowrap"
              >
                {copiedStates.tokenAddress ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-gray-500"> (Sepolia USDT)</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="creator">Creator Address</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    The wallet address of the person who created the lock.
                    This is required to identify the correct lock to unlock.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex space-x-2">
              <Input
                id="creator"
                placeholder="0x..."
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                required
              />
              {creator && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => copyToClipboard(creator, 'creator')}
                  className="whitespace-nowrap"
                >
                  {copiedStates.creator ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="secret">Secret</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    This is the original secret value you received from the lock creator.
                    It can be entered as plain text or as a 0x-prefixed hex value.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex space-x-2">
              <Input
                id="secret"
                placeholder="Enter the secret to unlock"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
              />
              {secret && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => copyToClipboard(secret, 'secret')}
                  className="whitespace-nowrap"
                >
                  {copiedStates.secret ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Enter the secret provided by the counterparty. This should be a 0x-prefixed hex value or plain text.
              The secret is used to unlock the tokens locked for you.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    This must match the timeout value from the original lock.
                    If you're unsure, ask the lock creator for this value.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="timeout"
              type="number"
              min="60"
              value={timeout}
              onChange={(e) => setTimeout(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              This should match the timeout value from the lock. Small values (e.g., 3600) are treated as duration.
              Large values are treated as Unix timestamps.
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !isConnected}
          >
            {loading ? "Processing..." : "Unlock"}
          </Button>
        </form>

        {lastTransaction && (
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium mb-2">Transaction Completed</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Transaction Hash:</span> {truncate(lastTransaction.tx?.hash)}</p>
              {lastTransaction.receipt && (
                <p><span className="font-medium">Gas Used:</span> {lastTransaction.receipt.gasUsed.toString()}</p>
              )}
              <p className="text-green-600 font-medium">
                Tokens have been successfully unlocked!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Unlock; 