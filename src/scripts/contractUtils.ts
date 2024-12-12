import { ethers } from "ethers";
import Abi from "@/contracts/platon_abi.json";  

const contractAddress = ""; // 合约地址

export const fetchComments = async () => {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, Abi, signer);
  
      const commentCount = await contract.getNumberOfComments();
      console.log("评论数量:", commentCount);
      const fetchedComments: any[] = [];

      const commentCountNumber = typeof commentCount === 'bigint'
        ? Number(commentCount)  // 将 BigInt 转换为普通数字
        : commentCount;  // 如果是普通数字，则直接使用
  
      for (let i = 0; i < commentCountNumber; i++) {
        const commentData = await contract.getComment(i);
        const timestampString = commentData[1].toString(); // 将unix时间戳转为字符串
        fetchedComments.push({
          content: commentData[0],  // 评论内容
          timestamp: timestampString,  // 评论时间
          likes: Number(commentData[2]),  // 将 likes 转为普通数字
          author: commentData[3],  // 获取作者地址
        });
      }
      console.log(fetchedComments);
  
      return fetchedComments;
    }
  
    throw new Error("Ethereum provider is not available");
  };