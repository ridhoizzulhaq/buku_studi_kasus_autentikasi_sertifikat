import React, { useState, useEffect } from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";
import CertificateAuthenticatorContract from "./CertificateAuthenticator";

const CONTRACT_ADDRESS = "ganti dengan milikmu!";

// Mendefinisikan gaya untuk sertifikat PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  header: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 30,
  },
  text: {
    fontSize: 14,
    textAlign: "left",
    marginBottom: 10,
  },
});

// Komponen CertificatePDF untuk menghasilkan tampilan sertifikat dalam format PDF
const CertificatePDF = ({ ownerName, description, certificateHash }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Certificate</Text>
      <Text style={styles.text}>Owner: {ownerName}</Text>
      <Text style={styles.text}>Description: {description}</Text>
      <Text style={styles.text}>Certificate Hash: {certificateHash}</Text>
    </Page>
  </Document>
);

// Komponen utama aplikasi
function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [description, setDescription] = useState("");
  const [certificateHash, setCertificateHash] = useState("");
  const [searchHash, setSearchHash] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // Inisialisasi aplikasi dengan mendeteksi penyedia Ethereum dan membuat instance kontrak
  useEffect(() => {
    const init = async () => {
      const provider = await detectEthereumProvider();
      if (provider) {
        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);
        const contractInstance = new web3Instance.eth.Contract(CertificateAuthenticatorContract.abi, CONTRACT_ADDRESS);
        setContract(contractInstance);

        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
      } else {
        console.error("Please install MetaMask");
      }
    };

    init();
  }, []);

  //fungsi membuat sertifikat baru
  const createCertificate = async () => {
    if (!contract) return;
    
    // Panggil metode createCertificate pada kontrak cerdas dan tunggu receipt
    const receipt = await contract.methods.createCertificate(ownerName, description).send({ from: account });
    
    // Dapatkan hash sertifikat dari event CertificateCreated dalam receipt
    const certificateHash = receipt.events.CertificateCreated.returnValues.certificateHash;
    
    // Tetapkan hash sertifikat ke state
    setCertificateHash(certificateHash);
  };
  

  // Fungsi untuk mencari sertifikat berdasarkan hash ID
  const searchCertificate = async () => {
    if (!contract) return;
    try {       const result = await contract.methods.getCertificate(searchHash).call();
      setSearchResult({ ownerName: result[0], description: result[1] });
    } catch (error) {
      console.error("Certificate not found");
      setSearchResult(null);
    }
  };

  return (
    <div>
      <h1>Create Certificate</h1>
      <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner Name" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <button onClick={createCertificate}>Create Certificate</button>
      {certificateHash && (
        <PDFDownloadLink document={<CertificatePDF ownerName={ownerName} description={description} certificateHash={certificateHash} />} fileName="certificate.pdf">
          {({ blob, url, loading, error }) =>
            loading ? "Loading document..." : "Download Certificate"
          }
        </PDFDownloadLink>
      )}

      <h1>Search Certificate</h1>
      <input value={searchHash} onChange={(e) => setSearchHash(e.target.value)} placeholder="Certificate Hash" />
      <button onClick={searchCertificate}>Search Certificate</button>
      {searchResult && (
        <div>
          <p>Owner: {searchResult.ownerName}</p>
          <p>Description: {searchResult.description}</p>
        </div>
      )}
    </div>
  );
}

export default App;
