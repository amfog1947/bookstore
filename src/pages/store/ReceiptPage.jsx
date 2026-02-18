import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../../firebase";
import { formatDateDDMMYYYY, formatInr } from "../../utils/format";
import shelfVerseLogo from "../../shelfverse-logo.png.png";

function toSafePdfText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function byteLength(value) {
  return new TextEncoder().encode(value).length;
}

function buildSimplePdf(lines) {
  const perPage = 42;
  const pages = [];
  for (let i = 0; i < lines.length; i += perPage) {
    pages.push(lines.slice(i, i + perPage));
  }

  const fontObj = 3;
  const firstPageObj = 4;
  const firstContentObj = firstPageObj + pages.length;
  const kids = pages.map((_, index) => `${firstPageObj + index} 0 R`).join(" ");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    `2 0 obj << /Type /Pages /Kids [${kids}] /Count ${pages.length} >> endobj\n`,
    `3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj\n`,
  ];

  pages.forEach((_, index) => {
    const pageObjId = firstPageObj + index;
    const contentObjId = firstContentObj + index;
    objects.push(
      `${pageObjId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 ${fontObj} 0 R >> >> >> endobj\n`
    );
  });

  pages.forEach((pageLines, pageIndex) => {
    const contentLines = ["BT", "/F1 12 Tf", "50 790 Td"];
    pageLines.forEach((line, index) => {
      if (index === 0) {
        contentLines.push(`(${toSafePdfText(line)}) Tj`);
      } else {
        contentLines.push(`0 -16 Td (${toSafePdfText(line)}) Tj`);
      }
    });
    contentLines.push("ET");
    const stream = `${contentLines.join("\n")}\n`;
    const contentObjId = firstContentObj + pageIndex;
    objects.push(
      `${contentObjId} 0 obj << /Length ${byteLength(stream)} >> stream\n${stream}endstream\nendobj\n`
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function formatInrPdf(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

function wrapPdfText(value, maxChars = 40) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      if (word.length > maxChars) {
        lines.push(word.slice(0, maxChars));
        current = word.slice(maxChars);
      } else {
        current = word;
      }
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : ["N/A"];
}

function formatPdfItemLines(item) {
  const titleChunks = wrapPdfText(item.title || "Book", 24);
  const qty = String(item.quantity || 1).padStart(2, " ");
  const amount = formatInrPdf(Number(item.price || 0) * Number(item.quantity || 1)).padStart(13, " ");
  const first = `${titleChunks[0].padEnd(24, " ")}  x${qty}  ${amount}`;
  const continued = titleChunks.slice(1).map((chunk) => `${chunk}`);
  return [first, ...continued];
}

function downloadReceiptPdf(receipt) {
  const date = receipt.createdAt?.toDate ? receipt.createdAt.toDate() : new Date();
  const addressLines = wrapPdfText(receipt.shippingAddress || "N/A", 38);
  const itemLines = (receipt.items || []).flatMap((item) => formatPdfItemLines(item));
  const lines = [
    "SHELFVERSE",
    "DIGITAL PURCHASE RECEIPT",
    "========================================",
    `Receipt ID      : ${receipt.id}`,
    `Date            : ${formatDateDDMMYYYY(date)}`,
    `Buyer Email     : ${receipt.buyerEmail || "N/A"}`,
    `Shipping Addr   : ${addressLines[0]}`,
    ...addressLines.slice(1).map((line) => `                  ${line}`),
    `Payment Method  : ${receipt.payment?.method || "N/A"}`,
    `Payment Ref     : ${receipt.payment?.reference || "N/A"}`,
    "----------------------------------------",
    "ITEM                    QTY      AMOUNT",
    "----------------------------------------",
    ...itemLines,
    "========================================",
    `TOTAL PAID           ${formatInrPdf(receipt.total || 0)}`,
  ];

  const blob = buildSimplePdf(lines);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `receipt-${receipt.id}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const autoDownloadedRef = useRef(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const snap = await getDoc(doc(db, "purchases", id));
        if (!snap.exists()) {
          setError("Receipt not found.");
        } else {
          setReceipt({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        setError("Unable to load receipt.");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  useEffect(() => {
    if (!receipt || autoDownloadedRef.current) return;
    autoDownloadedRef.current = true;
    downloadReceiptPdf(receipt);
  }, [receipt]);

  const date = useMemo(
    () => (receipt?.createdAt?.toDate ? receipt.createdAt.toDate() : new Date()),
    [receipt]
  );

  if (loading) {
    return <p>Loading receipt...</p>;
  }

  if (error) {
    return (
      <section>
        <p className="error">{error}</p>
        <Link to="/">Back to store</Link>
      </section>
    );
  }

  return (
    <section className="receipt reveal" id="receipt-area">
      <div className="receipt-content">
        <div className="receipt-brand">
          <img className="receipt-logo-img" src={shelfVerseLogo} alt="ShelfVerse logo" />
          <div>
            <p className="receipt-brand-name">ShelfVerse</p>
            <p className="receipt-brand-sub">Digital Purchase Receipt</p>
          </div>
        </div>

        <p className="eyebrow">Payment Success</p>
        <h1>Purchase Receipt</h1>
        <p>Receipt ID: {receipt.id}</p>
        <p>Date: {formatDateDDMMYYYY(date)}</p>
        <p>Buyer: {receipt.buyerEmail}</p>
        <p>Shipping Address: {receipt.shippingAddress || "N/A"}</p>
        <p>Payment Method: {receipt.payment?.method || "N/A"}</p>
        <p>Payment Ref: {receipt.payment?.reference || "N/A"}</p>
        <hr />
        {receipt.items.map((item) => (
          <div key={item.id} className="receipt-line">
            <span>
              {item.title} x {item.quantity}
            </span>
            <span>{formatInr(item.price * item.quantity)}</span>
          </div>
        ))}
        <hr />
        <h2>Total Paid: {formatInr(receipt.total || 0)}</h2>
        <div className="receipt-actions">
          <button className="btn" onClick={() => downloadReceiptPdf(receipt)}>
            Download PDF
          </button>
          <div className="receipt-actions-right">
            <button className="btn ghost" onClick={() => window.print()}>
              Print Receipt
            </button>
            <Link className="btn ghost" to="/">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
