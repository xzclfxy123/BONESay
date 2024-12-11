"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { fetchComments } from "@/scripts/contractUtils";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function Header({
  onSortByTime,
  onSortByLikes,
}: {
  onSortByTime: () => void;
  onSortByLikes: () => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setIsConnected(true);
          setAccount(accounts[0]);
        }
      } catch (err) {
        console.error("获取账户失败", err);
      }
    } else {
      alert('请安装MetaMask!')
    }
  };

  // 连接钱包
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });

        const platonChainId = "0x335f9";

        if (chainId !== platonChainId) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: platonChainId }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: platonChainId,
                      chainName: "PlatON Main Network",
                      nativeCurrency: {
                        name: "LAT",
                        symbol: "LAT",
                        decimals: 18,
                      },
                      rpcUrls: ["https://openapi2.platon.network/rpc"],
                      blockExplorerUrls: ["https://scan.platon.network/"],
                    },
                  ],
                });
              } catch (addError) {
                throw addError;
              }
            } else {
              throw switchError; 
            }
          }
        }

        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        setIsConnected(true);
        setAccount(accounts[0]);
        setError("");
        
        window.location.reload()
        fetchComments()
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      setError("请安装 MetaMask");
    }
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-md bg-[#44d62c]">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Image
              src="/bones.png"
              alt="BOENS Logo"
              width={40}
              height={40}
              className="h-8 w-8"
            />
            <Link href="/" className="text-2xl font-bold text-white">
              BONESay
            </Link>
          </div>
          <div className="flex space-x-4 text-black">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  ABOUT <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white">
                <DropdownMenuLabel>
                  <Link href={"https://bones.icu/"}>BONES</Link>
                </DropdownMenuLabel>
                <DropdownMenuLabel>
                  <Link href={"https://register.deworkhub.com/"}>ONBOARD</Link>
                </DropdownMenuLabel>
                <DropdownMenuLabel>
                  <Link href={"https://pay.deworkhub.com/"}>BONESPay</Link>
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={onSortByTime}>
              按时间排序
            </Button>
            <Button variant="outline" size="sm" onClick={onSortByLikes}>
              按点赞排序
            </Button>
          </div>
        </div>

        <nav>
          <ul className="flex space-x-4">
            <Button
              variant="outline"
              className="w-50"
              onClick={connectWallet}
              disabled={isConnected}
            >
              <Image
                src="/metamask.png?height=20&width=20"
                alt="MetaMask Icon"
                width={20}
                height={20}
                style={{ height: "auto" }}
              />
              {isConnected ? `已连接账户 : ${account.slice(0, 6)}...${account.slice(-4)}` : "连接 MetaMask"}
            </Button>
          </ul>
        </nav>
      </div>
    </header>
  );
}
