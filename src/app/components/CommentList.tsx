import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ethers } from "ethers"
import Abi from "@/contracts/platon_abi.json"
import { fetchComments } from '@/scripts/contractUtils'
import { TipButton } from '@/app/components/TipButton'
import { toast } from '@/components/ui/use-toast'
import { Toast } from '@/components/ui/toast'

interface Comment {
  content: string;
  timestamp: string;
  likes: number;
  author: string;
}

interface CommentListProps {
  comments: Comment[]
}

const contractAddress = "0x83d471Bc460bfB6c1119E084a6f0d2c21672c37d"
const contractABI = Abi

export function CommentList({ comments }: CommentListProps) {
  const [commentsState, setCommentsState] = useState<Comment[]>(comments)
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null)
  const [tippingComment, setTippingComment] = useState<string | null>(null)
  const [account, setAccount] = useState<string>("")
  const [tipAmount, setTipAmount] = useState<string>("")  // 用于存储用户输入的打赏金额
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)  // 用于控制打赏弹窗的显示
  const [error, setError] = useState<string>("")  // 用于显示输入错误信息

  const tippingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkConnection()
    fetchComments()
  }, [])

  // 检查 MetaMask 钱包连接
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

  // 点赞评论
  const likeComment = async (commentId: number) => {
    if (isNaN(commentId)) {
      console.error("无效的 commentId:", commentId);
      alert("评论 ID 无效，请重新尝试");
      return;
    }
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
      try {
        const tx = await contract.likeComment(commentId); 
        await tx.wait();

        const updatedComments = commentsState.map(comment => {
          if (comment.timestamp === commentId.toString()) {
            // 如果评论的 ID 匹配，增加点赞数
            return { ...comment, likes: comment.likes + 1 };
          }
          return comment;
        })
        setCommentsState(updatedComments)

        window.location.reload(); // 强制刷新页面
        console.log("点赞后：", fetchComments())

      } catch (error) {
        // 判断是否是用户拒绝的错误
        if (error instanceof Error) {
          // 如果是 MetaMask 拒绝交易的错误
          if ((error as any).code === 4001) {
            console.error("用户拒绝了交易签名", error);
            alert("交易被用户拒绝，请再次尝试");
          } 
          // 处理 ERC20 错误，表示已点赞
          else if ((error as any).code === -32603) {
            console.error("已点赞，不能重复点赞", error);
            alert("您已经点赞过此评论");
          } 
          else if (error.message.includes("You have already liked this comment")) {
            console.error("已点赞，不能重复点赞", error);
            alert("您已经点赞过此评论");
          } 
          else {
            // 其他类型的错误
            console.error("点赞失败:", error);
            alert("点赞操作失败，请稍后再试");
          }
        } else {
          // 如果 error 不是 Error 类型
          console.error("发生了未知错误", error);
          alert("发生了未知错误，请稍后再试");
        }
      }
    }
  };

  // 打赏评论
  const tipComment = async (commentId: number) => {
    if (typeof window.ethereum === "undefined") {
      alert("请安装 MetaMask 钱包以进行打赏！");
      return;
    }
  
    // 检查打赏金额是否有效
    const tipValue = parseFloat(tipAmount);
    if (!tipAmount || tipValue <= 0 || tipValue > 1000) {
      setError("请输入一个有效的金额，范围是 0 到 1000 LAT");
      return;
    }
  
    try {
      // 初始化以太坊连接
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
      // 调用合约的打赏方法
      const tx = await contract.receiveTip(commentId, { value: ethers.parseUnits(tipAmount, 18) });
      await tx.wait();
  
      // 打赏成功提示
      setIsModalOpen(false); // 关闭弹窗
      setTipAmount(""); // 清空输入框
      alert("打赏成功！");
      fetchComments(); // 更新评论数据
    } catch (error: any) {
      // 错误处理
      console.error("打赏失败:", error);
      if (error.code === 4001) {
        alert("交易被用户拒绝！");
      } else {
        alert("打赏失败，请稍后再试！");
      }
    }
  };

  // 复制评论
  const copyToClipboard = (text: string, commentId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCommentId(commentId)
      setTimeout(() => setCopiedCommentId(null), 2000)
      console.log(commentId)
    })
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tippingRef.current && !tippingRef.current.contains(event.target as Node)) {
        setTippingComment(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {comments.map((comment, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-800">{comment.content}</p>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>{comment.author.slice(0, 6)}...{comment.author.slice(-4)} <br/> {new Date(Number(comment.timestamp.substring(0, 10)) * 1000).toLocaleString()}</span>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-primary" onClick={() => (likeComment(index))}>{comment.likes} 👍</Button>
                <Tooltip open={copiedCommentId === comment.timestamp}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(comment.content, comment.timestamp)}>
                      复制
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>复制成功</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setTippingComment(comment.timestamp)}>
                      打赏
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>给这条评论打赏</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div> 

            {tippingComment === comment.timestamp && (
              <div ref={tippingRef} className="mt-2 flex justify-end space-x-2">
                <TipButton recipient={comment.author} token="LAT" />
                <TipButton recipient={comment.author} token="USDT" />
                <TipButton recipient={comment.author} token="USDC" />
              </div>
            )}
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}

