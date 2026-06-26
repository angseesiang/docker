import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { WorkspaceAnswers } from './excelHandler';

// Declare global types for jsPDF autotable plugins if they are missing
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface WorkspaceData {
  companyName: string;
  appName: string;
  appDescription: string;
  workspaceName: string;
  created_at: string;
}

export function exportToPdf(
  workspace: WorkspaceData,
  answers: WorkspaceAnswers,
  checklistJson: any,
  moonshotResults: any | null
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper to add header and footer (runs on every page except cover page)
  const addHeaderAndFooter = (pageNum: number, totalPages: number) => {
    if (pageNum === 1) return; // Skip cover page
    
    // Header
    doc.setFont('Inter', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text("AI Verify Testing Framework - Process Checks Summary Report", 14, 10);
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.line(14, 12, pageWidth - 14, 12);

    // Footer
    const footerText = `Page ${pageNum} of ${totalPages}`;
    doc.text(footerText, pageWidth - 14 - doc.getTextWidth(footerText), pageHeight - 10);
    doc.text(`Application: ${workspace.appName || 'N/A'}  |  Company: ${workspace.companyName || 'N/A'}`, 14, pageHeight - 10);
    doc.line(14, pageHeight - 13, pageWidth - 14, pageHeight - 13);
  };

  // ----------------------------------------------------
  // COVER PAGE (Page 1)
  // ----------------------------------------------------
  
  // Background decoration (purple sidebar banner)
  doc.setFillColor(91, 33, 182); // primary purple (#5B21B6)
  doc.rect(0, 0, 10, pageHeight, 'F');
  
  // Content block
  doc.setTextColor(91, 33, 182);
  doc.setFont('Outfit', 'bold');
  doc.setFontSize(28);
  doc.text("AI Verify", 20, 50);
  
  doc.setFontSize(16);
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text("PROCESS CHECKS TOOL FOR GENERATIVE AI", 20, 58);
  
  doc.setDrawColor(91, 33, 182);
  doc.setLineWidth(1.5);
  doc.line(20, 66, 100, 66);
  
  doc.setFont('Outfit', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39); // gray-900
  doc.text("Summary Assessment Report", 20, 95);
  
  // Metadata fields
  const metaStartY = 130;
  const metaLabelX = 20;
  const metaValueX = 70;
  const lineSpacing = 12;

  doc.setFont('Inter', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  
  const labels = [
    "Company Name",
    "Application Name",
    "Application Description",
    "Workspace ID",
    "Assessment Date"
  ];
  
  const values = [
    workspace.companyName || "N/A",
    workspace.appName || "N/A",
    workspace.appDescription || "No description provided.",
    workspace.workspaceName || "N/A",
    workspace.created_at ? new Date(workspace.created_at).toLocaleDateString() : new Date().toLocaleDateString()
  ];
  
  let currentY = metaStartY;
  for (let i = 0; i < labels.length; i++) {
    doc.setFont('Inter', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(labels[i], metaLabelX, currentY);
    
    doc.setFont('Inter', 'normal');
    doc.setTextColor(31, 41, 55);
    
    // Multi-line wrap for application description
    if (labels[i] === "Application Description") {
      const splitDesc = doc.splitTextToSize(values[i], pageWidth - metaValueX - 15);
      doc.text(splitDesc, metaValueX, currentY);
      currentY += (splitDesc.length * 5) + 4;
    } else {
      doc.text(values[i], metaValueX, currentY);
      currentY += lineSpacing;
    }
  }

  // Cover footer disclaimer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text("This report is generated using the AI Verify Testing Framework for Generative AI Process Checks. All outputs are based on assessments provided by the user.", 20, pageHeight - 20, {
    maxWidth: pageWidth - 40
  });

  // ----------------------------------------------------
  // EXECUTIVE SUMMARY (Page 2)
  // ----------------------------------------------------
  doc.addPage();
  
  doc.setFont('Outfit', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(91, 33, 182);
  doc.text("Executive Summary", 14, 25);
  
  // Calculate statistics
  let totalQuestions = 0;
  let totalAnswered = 0;
  let yesCount = 0;
  let noCount = 0;
  let naCount = 0;

  const principleStats: Array<{
    key: string;
    name: string;
    total: number;
    answered: number;
  }> = [];

  Object.keys(checklistJson).forEach(principleKey => {
    const pData = checklistJson[principleKey];
    const checks = pData.process_checks;
    const pTotal = Object.keys(checks).length;
    let pAnswered = 0;
    
    Object.keys(checks).forEach(processId => {
      totalQuestions++;
      // Search in answers
      let ans = null;
      for (const oId of Object.keys(answers)) {
        if (answers[oId] && answers[oId][processId]) {
          ans = answers[oId][processId];
          break;
        }
      }
      
      if (ans && ans.implementation) {
        totalAnswered++;
        pAnswered++;
        if (ans.implementation === "Yes") yesCount++;
        else if (ans.implementation === "No") noCount++;
        else if (ans.implementation === "N/A") naCount++;
      }
    });

    // Extract clean name (e.g. "Transparency")
    const cleanName = principleKey.replace(/^\d+\.\s*/, '');
    principleStats.push({
      key: principleKey,
      name: cleanName,
      total: pTotal,
      answered: pAnswered
    });
  });

  const completionPercent = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  // Render Stats Grid
  doc.setFillColor(249, 250, 251); // light gray (#F9FAFB)
  doc.setDrawColor(229, 231, 235);
  doc.rect(14, 32, pageWidth - 28, 30, 'DF');
  
  doc.setFont('Outfit', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(91, 33, 182);
  doc.text(`${completionPercent}%`, 25, 48);
  doc.setFont('Inter', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("COMPLETION SCORE", 25, 54);

  doc.setFont('Outfit', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55);
  doc.text(`${totalAnswered} / ${totalQuestions}`, 75, 48);
  doc.setFont('Inter', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("PROCESSES CHECKED", 75, 54);

  // Breakdown Table inside stats grid
  doc.setFont('Inter', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61); // Green
  doc.text(`Yes: ${yesCount}`, 145, 43);
  doc.setTextColor(185, 28, 28); // Red
  doc.text(`No: ${noCount}`, 145, 49);
  doc.setTextColor(91, 33, 182); // Violet
  doc.text(`N/A: ${naCount}`, 145, 55);

  // Render Principle Progress Table
  doc.setFont('Outfit', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text("Principles Checklist Progress", 14, 75);

  const statsBody = principleStats.map(stat => {
    const pct = stat.total > 0 ? Math.round((stat.answered / stat.total) * 100) : 0;
    return [
      stat.key,
      `${stat.answered} of ${stat.total}`,
      `${pct}%`
    ];
  });

  doc.autoTable({
    startY: 80,
    head: [["Principle", "Processes Answered", "Completion %"]],
    body: statsBody,
    theme: 'striped',
    headStyles: {
      fillColor: [109, 40, 217], // violet-600
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' }
    }
  });

  // If technical test results exist, append to Executive Summary
  if (moonshotResults) {
    let nextY = (doc as any).lastAutoTable.finalY + 12;
    if (nextY > pageHeight - 40) {
      doc.addPage();
      nextY = 25;
    }
    
    doc.setFont('Outfit', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text("Technical Test Summary (Project Moonshot)", 14, nextY);

    const execMetadata = moonshotResults.metadata || {};
    const stats = moonshotResults.results?.stats || { total: 0, passed: 0, failed: 0 };

    doc.autoTable({
      startY: nextY + 5,
      head: [["Metric", "Value"]],
      body: [
        ["Model / Connector Name", execMetadata.connector_name || "N/A"],
        ["Total Evaluation Datasets", stats.total || "0"],
        ["Passed Assessments", stats.passed || "0"],
        ["Failed Assessments", stats.failed || "0"]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // indigo-600
        textColor: [255, 255, 255]
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 115 }
      }
    });
  }

  // ----------------------------------------------------
  // DETAILED COMPLIANCE REPORT (Page 3+)
  // ----------------------------------------------------
  Object.keys(checklistJson).forEach(principleKey => {
    doc.addPage();
    
    const pData = checklistJson[principleKey];
    
    doc.setFont('Outfit', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(91, 33, 182);
    doc.text(principleKey, 14, 25);
    
    // Description
    doc.setFont('Inter', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99); // gray-600
    const splitDesc = doc.splitTextToSize(pData.principle_description, pageWidth - 28);
    doc.text(splitDesc, 14, 32);
    
    let tableStartY = 32 + (splitDesc.length * 4.5) + 6;
    
    // Collect rows
    const checks = pData.process_checks;
    const tableBody: any[] = [];
    
    // Sort process check keys
    const sortedKeys = Object.keys(checks).sort();
    
    sortedKeys.forEach(processId => {
      const check = checks[processId];
      
      // Look up answer
      let ans: { implementation: "Yes" | "No" | "N/A" | null; elaboration: string } = { implementation: null, elaboration: "" };
      for (const oId of Object.keys(answers)) {
        if (answers[oId] && answers[oId][processId]) {
          ans = answers[oId][processId];
          break;
        }
      }
      
      const processText = `${processId}\n${check.process_to_achieve_outcomes}`;
      const evidenceText = `Type: ${check.evidence_type}\n\nEvidence: ${check.evidence}`;
      const implText = ans.implementation || "Unanswered";
      const elabText = ans.elaboration || "No elaboration provided.";
      
      tableBody.push([
        processText,
        evidenceText,
        implText,
        elabText
      ]);
    });
    
    doc.autoTable({
      startY: tableStartY,
      head: [["Process ID & Description", "Evidence Expected", "Status", "Elaboration"]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [109, 40, 217],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
        valign: 'top'
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 50 },
        2: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
        3: { cellWidth: 63 }
      },
      didParseCell: (data: any) => {
        // Color cells for implementation status
        if (data.column.index === 2 && data.cell.section === 'body') {
          const val = data.cell.text[0];
          if (val === 'Yes') {
            data.cell.styles.textColor = [21, 128, 61]; // green-700
          } else if (val === 'No') {
            data.cell.styles.textColor = [185, 28, 28]; // red-700
          } else if (val === 'N/A') {
            data.cell.styles.textColor = [91, 33, 182]; // purple-700
          } else {
            data.cell.styles.textColor = [156, 163, 175]; // gray-400
          }
        }
      }
    });
  });

  // ----------------------------------------------------
  // ADD PAGE NUMBERS AND HEADERS
  // ----------------------------------------------------
  const totalPages = (doc as any).internal.pages.length - 1; // jsPDF has a blank page at the end of internally tracked pages
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndFooter(i, totalPages);
  }

  // Save report
  doc.save(`AI_Verify_Report_${workspace.appName.replace(/\s+/g, '_') || 'Assessment'}.pdf`);
}
