import React from 'react';
import '../styles/About.scss';
import Navbar from './Navbar';

const About = () => (
  <div className="about-wrapper">

      <Navbar />  

    <div className="about-containers">
      <h1>About Art Museum NFT DApp</h1>
      <p>
        <strong>Art Museum NFT DApp</strong> là một nền tảng Web3 cho phép bạn tạo, lưu trữ, giao dịch và khám phá các tác phẩm nghệ thuật số dưới dạng NFT trên blockchain Ethereum.
      </p>
      <h2>Tính năng nổi bật</h2>
      <ul>
        <li><strong>AI Art Generator:</strong> Sinh ảnh nghệ thuật bằng AI (Stable Diffusion) từ mô tả của bạn.</li>
        <li><strong>Mint NFT:</strong> Lưu trữ tác phẩm trên IPFS (Pinata) và mint NFT trực tiếp lên blockchain.</li>
        <li><strong>Gallery:</strong> Quản lý bộ sưu tập NFT cá nhân, đồng bộ trực tiếp với blockchain.</li>
        <li><strong>Marketplace:</strong> Đăng bán, mua, hủy bán NFT hoàn toàn phi tập trung.</li>
        <li><strong>Semantic Enrichment:</strong> Làm giàu metadata nghệ thuật từ các nguồn như WikiData, Getty AAT.</li>
      </ul>
      <h2>Công nghệ sử dụng</h2>
      <ul>
        <li>Frontend: ReactJS, SCSS, Ethers.js</li>
        <li>Smart Contract: Solidity (ERC-721, Marketplace), Hardhat</li>
        <li>Backend: Python Flask (AI, IPFS, Semantic)</li>
        <li>AI: Stable Diffusion API</li>
        <li>IPFS Storage: Pinata</li>
        <li>Semantic: Xử lý dữ liệu nghệ thuật với chuẩn quốc tế</li>
      </ul>
      <h2>Quy trình sử dụng</h2>
      <ol>
        <li><strong>Tạo tác phẩm:</strong> Nhập mô tả &rarr; AI sinh ảnh &rarr; Xem trước.</li>
        <li><strong>Mint NFT:</strong> Ảnh upload lên IPFS &rarr; Tạo metadata &rarr; Xác nhận MetaMask &rarr; NFT lưu trên blockchain.</li>
        <li><strong>Quản lý & giao dịch:</strong> Xem gallery &rarr; Đăng bán NFT &rarr; Giao dịch phi tập trung.</li>
      </ol>
      <h2>Đóng góp & phát triển</h2>
      <p>
        Dự án mã nguồn mở, khuyến khích đóng góp về AI, blockchain, semantic, UI/UX.<br />
        Mọi ý kiến đóng góp hoặc báo lỗi xin gửi về GitHub hoặc liên hệ nhóm phát triển.
      </p>
      <div className="about-footer">
        <strong>Art Museum NFT DApp</strong> &mdash; Nơi nghệ thuật số gặp gỡ công nghệ blockchain và AI!
      </div>
    </div>
  </div>
);

export default About;