import { useState, useEffect, useCallback } from "react";
import { Card, Input, Upload, Button, ConfigProvider, theme, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { createEvents } from "ics";
import { transformSpreadsheet } from "../../lib/vagtplan";

const { Dragger } = Upload;

interface CustomFile extends UploadFile {
  data?: Uint8Array;
}

const CalendarGenerator: React.FC = () => {
  const [code, setCode] = useState<string>(() => {
    const savedCode = localStorage.getItem("calendarCode");
    return savedCode ? savedCode.toUpperCase() : "";
  });
  const [file, setFile] = useState<CustomFile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value.toUpperCase();
    setCode(newCode);
    localStorage.setItem("calendarCode", newCode);
  };

  const handleFileChange = (info: any) => {
    const { status } = info.file;
    if (status !== "uploading") {
      if (status === "removed") {
        setFile(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        setFile({ ...info.file, data });
      };
      reader.readAsArrayBuffer(info.file.originFileObj);
    }
  };

  const generateCalendar = useCallback(() => {
    if (!file?.data) return;

    let events;
    try {
      events = transformSpreadsheet(file.data, code);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ukendt fejl");
      return;
    }
    if (events.length === 0) {
      message.warning("Du har ingen vagter i dette skema");
      return;
    }
    const { value: calendar } = createEvents(events);
    if (!calendar) return;

    const blob = new Blob([calendar], { type: "text/calendar" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "calendar.ics");
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    link.remove();
  }, [file, code, transformSpreadsheet]);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#98D8C6",
          borderRadius: 8,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        },
      }}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDarkMode ? "#162922" : "#dcefe8",
        }}>
        <Card
          style={{
            width: 600,
            maxWidth: "90%",
            borderRadius: "24px",
            backgroundColor: isDarkMode ? "#2a453c" : "#f0f9f6",
          }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Input
              className="uppercase-input"
              size="large"
              placeholder="Indtast dine initialer"
              value={code}
              onChange={(e) => handleCodeChange({ ...e, target: { ...e.target, value: e.target.value.toUpperCase() } })}
              style={{
                fontSize: "1.5rem",
                textAlign: "center",
                backgroundColor: isDarkMode ? "#1f332c" : "#ffffff",
                textTransform: "uppercase",
              }}
            />

            <Dragger
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              maxCount={1}
              customRequest={({ file, onSuccess }) => onSuccess && onSuccess(file)}
              showUploadList={true}
              onChange={handleFileChange}
              onRemove={() => setFile(null)}
              style={{ padding: "2rem" }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: "3rem", color: "#98D8C6" }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: "1.2rem", color: "inherit" }}>
                Klik eller træk vagtskema her
              </p>
            </Dragger>

            <Button
              type="primary"
              size="large"
              disabled={!code || !file}
              onClick={generateCalendar}
              style={{ height: "4rem", fontSize: "1.2rem" }}>
              Download kalender
            </Button>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default CalendarGenerator;
