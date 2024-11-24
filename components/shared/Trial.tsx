'use client'; // Enables client-side rendering for Next.js

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, useEffect } from "react";

export default function GeneratePDF() {
  const [mydata, setData] = useState<any>([]);
  const [totalWeeks, setTotalWeeks] = useState(20); // Default to 20 weeks
  const [lessonsPerWeek, setLessonsPerWeek] = useState(5); // Default lessons per week
  const [breaks, setBreaks] = useState([{ week: 2, title: "Mid-Term Break" },{ week: 4, title: "Mid-Term Break" }]); // Example breaks

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        'http://127.0.0.1:4000/api/mathematics/f1/getmathematicsdata'
      );
      const data = await res.json();
      setData(data.data);
    };

    fetchData();
  }, []);

  const createPDF = () => {
    const doc = new jsPDF("l", "pt", "a4");

    const headers = [
      ["Week", "Lesson", "Topic", "Sub-Topic", "Objectives", "T/L Activities", "T/L Aids", "Reference"]
    ];

    const body: any[] = [];
    const totalLessons = totalWeeks * lessonsPerWeek;
    const totalTopics = mydata.length;

    let lessonPlan = [];

    // Step 1: Calculate how to distribute topics
    if (totalTopics > totalLessons) {
      // Combine topics into lessons when there are more topics than lessons
      const topicsPerLesson = Math.ceil(totalTopics / totalLessons);
      let topicIndex = 0;

      for (let i = 0; i < totalLessons; i++) {
        const combinedTopics = [];
        for (let j = 0; j < topicsPerLesson && topicIndex < totalTopics; j++) {
          combinedTopics.push(mydata[topicIndex]);
          topicIndex++;
        }
        lessonPlan.push(combinedTopics);
      }
    } else {
      // Stretch topics across lessons when there are more lessons than topics
      const lessonsPerTopic = Math.floor(totalLessons / totalTopics);
      const extraLessons = totalLessons % totalTopics; // Remaining lessons to distribute

      let extraDistributed = 0;
      for (let i = 0; i < totalTopics; i++) {
        const stretch = lessonsPerTopic + (extraDistributed < extraLessons ? 1 : 0);
        for (let j = 0; j < stretch; j++) {
          lessonPlan.push([mydata[i]]);
        }
        if (extraDistributed < extraLessons) extraDistributed++;
      }
    }

    // Step 2: Generate rows for each week and lesson
    let planIndex = 0;
    for (let week = 1; week <= totalWeeks; week++) {
      const breakData = breaks.find((b) => b.week === week);
      if (breakData) {
        body.push([{ content: `Week ${week}: ${breakData.title}`, colSpan: 8, styles: { halign: "center" } }]);
        continue;
      }

      for (let lesson = 1; lesson <= lessonsPerWeek; lesson++) {
        if (planIndex < lessonPlan.length) {
          const lessonTopics = lessonPlan[planIndex];
          lessonTopics.forEach(topic => {
            body.push([
              `Week ${week}`,
              `Lesson ${lesson}`,
              topic.topic,
              topic.subTopic,
              topic.objectives,
              topic.activities,
              topic.aids,
              topic.reference,
            ]);
          });
          planIndex++;
        }
      }
    }
    
// Get the page width and height
var pageWidth = doc.internal.pageSize.getWidth();
var pageHeight = doc.internal.pageSize.getHeight();

// Calculate the center coordinates
var centerX = pageWidth / 2;
var centerY = pageHeight / 2;

// Add the text, centering it both horizontally and vertically, with a larger font size
doc.setFontSize(32); // Set the font size to 24
doc.text("Mathematics", centerX, centerY - 40, { align: 'center' });
doc.setFontSize(32); // Set the font size to 18
doc.text("Term1", centerX, centerY, { align: 'center' });
doc.text("Mangu high school", centerX, centerY + 40, { align: 'center' });
    doc.addPage();
    autoTable(doc, {
      head: headers,
      body,
      startY: 10,
      theme: "grid",
      styles: { valign: "middle", cellWidth: "auto", minCellWidth: 4 },
      margin: 20,
      headStyles: {
        fillColor: [220, 230, 240],
        textColor: [0, 0, 0],
        fontSize: 12,
        fontStyle: "bold",
      },
    });

    doc.save("schemes-of-work.pdf");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Generate Schemes of Work PDF</h1>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Total Weeks:
          <input
            type="number"
            value={totalWeeks}
            onChange={(e) => setTotalWeeks(parseInt(e.target.value))}
            style={{ marginLeft: "10px", padding: "5px", width: "50px" }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Lessons Per Week:
          <input
            type="number"
            value={lessonsPerWeek}
            onChange={(e) => setLessonsPerWeek(parseInt(e.target.value))}
            style={{ marginLeft: "10px", padding: "5px", width: "50px" }}
          />
        </label>
      </div>
      <button
        style={{
          padding: "10px 20px",
          backgroundColor: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        onClick={createPDF}
      >
        Download PDF
      </button>
    </div>
  );
}
