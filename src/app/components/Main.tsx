'use client'

import { Header } from './Header'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { CommentList } from './CommentList'
import { ethers } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'
import { fetchComments } from '@/scripts/contractUtils'

export default function Main() {
  const [comments, setComments] = useState<any[]>([]);
  const [account, setAccount] = useState<string>("");
  const [sortingMethod, setSortingMethod] = useState<'latest' | 'hottest' | null>(null)

  // 获取当前 MetaMask 钱包地址
  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (err) {
        console.error("获取账户失败", err);
      }
    }
  };

  // 在页面加载时获取链上评论数据
  const loadComments = async () => {
    try {
      const fetchedComments = await fetchComments();
      setComments(fetchedComments);
      console.log("评论数据:", fetchedComments);
    } catch (error) {
      console.error("加载评论失败:", error);
    }
  };

  useEffect(() => {
    checkConnection()
    loadComments()
  }, [])

  const sortByTime = () => {
    const sorted = [...comments].sort((a, b) => b.timestamp - a.timestamp);
    setComments(sorted);
    setSortingMethod('latest')
  };

  const sortByLikes = () => {
    const sorted = [...comments].sort((a, b) => b.likes - a.likes);
    setComments(sorted);
    setSortingMethod('hottest')
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const commentContent = (form.elements.namedItem('comment') as HTMLTextAreaElement).value;

    checkConnection()
    if (!account) {
      alert("请连接钱包");
      return;
    }

    try {
      // 检查是否有 MetaMask
      if (typeof window.ethereum === "undefined") {
        alert("请安装 MetaMask!");
        return;
      }
      
      // 设置 provider 和 signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractAddress = "0x83d471Bc460bfB6c1119E084a6f0d2c21672c37d";
      const contractABI = [
        // 包含 `comment` 函数的 ABI
        "function comment(string commentString) public returns (int)"
      ];

      // 创建智能合约实例
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // 调用合约的 `comment` 方法
      const tx = await contract.comment(commentContent);
      console.log("交易发送中...", tx.hash);

      // 等待交易完成
      await tx.wait();
      console.log("交易完成:", tx.hash);

      // 更新评论列表
      await loadComments();
      form.reset();
    } catch (error) {
      console.error("提交评论失败:", error);
      alert("提交评论失败，请检查钱包连接或智能合约配置");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSortByTime={sortByTime} onSortByLikes={sortByLikes} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                说点什么？
              </label>
              <Textarea
                id="comment"
                name="comment"
                placeholder="在这里写入你的吐槽..."
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">提交 !</Button>
            </div>
          </form>
          <div className="mt-8">
          评论列表 {sortingMethod === 'latest' ? '（最新）' : sortingMethod === 'hottest' ? '（最热）' : ''}
            <div className='max-h-[595px] overflow-auto hide-scrollbar pl-2 pr-4 py-2'>
                <CommentList comments={comments} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
