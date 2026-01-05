import { mdToPdf } from "md-to-pdf";
import * as path from "path";
import * as fs from "fs";

const DOCS_DIR = path.join(__dirname, "..", "docs");

const MANUALS = [
  { file: "USER_MANUAL.md", output: "USER_MANUAL_KO.pdf" },
  { file: "USER_MANUAL_EN.md", output: "USER_MANUAL_EN.pdf" },
  { file: "USER_MANUAL_TH.md", output: "USER_MANUAL_TH.pdf" },
];

// CSS 파일 생성
const CSS_PATH = path.join(DOCS_DIR, "manual-style.css");
const CSS_CONTENT = `
body {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #333;
}
h1 {
  color: #1e3a5f;
  border-bottom: 2px solid #00d4aa;
  padding-bottom: 10px;
  margin-top: 30px;
}
h2 {
  color: #1e3a5f;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
  margin-top: 25px;
  page-break-before: always;
}
h2:first-of-type,
h2:nth-of-type(2) {
  page-break-before: avoid;
}
h3 {
  color: #2c5282;
  margin-top: 20px;
}
img {
  max-width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin: 15px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
ul, ol {
  padding-left: 20px;
}
li {
  margin: 5px 0;
}
hr {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 30px 0;
}
code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10pt;
}
blockquote {
  border-left: 4px solid #00d4aa;
  padding-left: 15px;
  margin: 15px 0;
  color: #666;
  background: #f9f9f9;
  padding: 10px 15px;
  border-radius: 0 8px 8px 0;
}
`;

async function generatePdf(inputFile: string, outputFile: string): Promise<void> {
  const inputPath = path.join(DOCS_DIR, inputFile);
  const outputPath = path.join(DOCS_DIR, outputFile);

  console.log(`📄 변환 중: ${inputFile} → ${outputFile}`);

  try {
    const pdf = await mdToPdf(
      { path: inputPath },
      {
        dest: outputPath,
        stylesheet: [CSS_PATH],
        pdf_options: {
          format: "A4",
          margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm",
          },
          printBackground: true,
        },
        launch_options: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      }
    );

    if (pdf) {
      console.log(`✅ 완료: ${outputFile}`);
    }
  } catch (error) {
    console.error(`❌ 오류: ${inputFile} - ${error}`);
  }
}

async function main(): Promise<void> {
  console.log("🚀 PDF 생성 시작");
  console.log(`📁 저장 위치: ${DOCS_DIR}`);
  console.log("");

  // CSS 파일 생성
  fs.writeFileSync(CSS_PATH, CSS_CONTENT);
  console.log("📝 스타일시트 생성 완료");
  console.log("");

  for (const manual of MANUALS) {
    await generatePdf(manual.file, manual.output);
  }

  console.log("");
  console.log("🎉 모든 PDF 생성 완료!");
}

main().catch(console.error);
