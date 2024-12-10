import { useState } from 'react'
import { ethers } from 'ethers'
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

interface TipButtonProps {
  recipient: string
  token: 'LAT' | 'USDT' | 'USDC'
}

const TOKEN_ADDRESSES = {
  USDT: '0xeac734fb7581D8eB2CE4949B0896FC4E76769509',
  USDC: '0xdA396A3C7FC762643f658B47228CD51De6cE936d'
}

const TOKEN_DECIMALS = {
  LAT: 18,
  USDT: 6,
  USDC: 6
}

export function TipButton({ recipient, token }: TipButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState('')

  const handleTip = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "错误",
        description: "请输入有效的打赏金额",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        let transaction;
        if (token === 'LAT') {
          transaction = await signer.sendTransaction({
            to: recipient,
            value: ethers.parseUnits(amount, TOKEN_DECIMALS[token])
          })
        } else {
          const tokenAddress = TOKEN_ADDRESSES[token]
          const tokenAbi = ["function transfer(address to, uint amount)"]
          const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer)

          transaction = await tokenContract.transfer(recipient, ethers.parseUnits(amount, TOKEN_DECIMALS[token]))
        }

        await transaction.wait()
        toast({
          title: "打赏成功",
          description: `成功发送 ${amount} ${token} 到 ${recipient}`,
        })
      } else {
        toast({
          title: "错误",
          description: "请安装支持PlatON网络的钱包!",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Error(handleTip方法): ', error)

      toast({
        title: "交易失败",
        description: "请检查您的余额和网络连接",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="number"
        placeholder={`输入 ${token} `}
        value={amount}
        onChange={(e) => {
          const value = parseFloat(e.target.value);
          if (!isNaN(value) && value >= 0) {
            setAmount(e.target.value);
          }
        }}
        min="0"
        step="any"
        className="w-24"
      />
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleTip}
        disabled={isLoading}
      >
        {isLoading ? '处理中...' : `${token} 打赏`}
      </Button>
    </div>
  )
}

