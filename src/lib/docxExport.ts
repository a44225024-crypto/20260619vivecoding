import type { ProjectRecord, CareerRecord } from '@/types';

export async function exportToDocx(
  projects: ProjectRecord[],
  careers: CareerRecord[],
  bidName: string
) {
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    HeadingLevel,
    WidthType,
  } = await import('docx');

  const headerRow = (labels: string[]) =>
    new TableRow({
      tableHeader: true,
      children: labels.map(
        (l) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: l, bold: true })],
              }),
            ],
          })
      ),
    });

  const dataRow = (values: string[]) =>
    new TableRow({
      children: values.map(
        (v) =>
          new TableCell({
            children: [new Paragraph(v || ' ')],
          })
      ),
    });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: '실적·경력 명세서',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `대상 공고: ${bidName || '(미입력)'}` }),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: '1. 유사용역 실적',
            heading: HeadingLevel.HEADING_2,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              headerRow(['용역명', '발주처', '계약금액', '수행기간', '주요 내용']),
              ...projects.map((p) =>
                dataRow([p.용역명, p.발주처, p.계약금액, p.수행기간, p.주요내용])
              ),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 400 } }),

          new Paragraph({
            text: '2. 기술자 경력',
            heading: HeadingLevel.HEADING_2,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              headerRow(['성명', '직위', '보유자격', '주요 경력']),
              ...careers.map((c) =>
                dataRow([c.성명, c.직위, c.보유자격, c.주요경력])
              ),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `선엔지니어링_실적경력_${bidName || '공고'}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
