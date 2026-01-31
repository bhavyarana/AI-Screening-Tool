import axios from "axios";
import getAccessToken from "./msAuth.js";

const appendToExcel = async ({
  name,
  email,
  matchScore,
  status,
  callStatus,
  recommendation,
}) => {
  const token = await getAccessToken();

  const url = `https://graph.microsoft.com/v1.0/me/drive/root:${process.env.EXCEL_FILE_PATH}:/workbook/tables/Table1/rows/add`;

  const row = [
    [
      name,
      email,
      matchScore,
      status,
      callStatus,
      recommendation,
      new Date().toISOString(),
    ],
  ];

  await axios.post(
    url,
    { values: row },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export default appendToExcel;
