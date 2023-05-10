// const userName = document.getElementById("name");
// const submitBtn = document.getElementById("submitBtn");

const { PDFDocument, rgb, degrees } = PDFLib;


const capitalize = (str, lower = false) =>
  (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) =>
    match.toUpperCase()
  );

const generatePDF = async (name, course, location, date, url) => {
  //const { PDFDocument, rgb, degrees } = PDFLib;
  const existingPdfBytes = await fetch("cert.pdf").then((res) =>
    res.arrayBuffer()
  );

  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);

  //get font

  const fontName = await fetch("./font/UTM French Vanilla.ttf").then((res) =>
    res.arrayBuffer()
  );
  const fontCourse = await fetch("./font/UTM Neo Sans IntelBold.ttf").then((res) =>
    res.arrayBuffer()
  );
  const fontCourseItalic = await fetch("./font/UTM Neo Sans Intel_Italic.ttf").then((res) =>
    res.arrayBuffer()
  );
  const fontDay = await fetch("./font/UTM Neo Sans Intel.ttf").then((res) =>
    res.arrayBuffer()
  );


  // Embed our custom font in the document
  const embedFontName = await pdfDoc.embedFont(fontName)
  const embedFontCourse = await pdfDoc.embedFont(fontCourse)
  const embedFontCourseItalic = await pdfDoc.embedFont(fontCourseItalic)
  const embedFontDay = await pdfDoc.embedFont(fontDay)
  // Get the first page of the document
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const newDate = new Date(date)
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  const formattedDate = newDate.toLocaleDateString('en-US', options);
  // Draw a string of text diagonally across the first page
  firstPage.drawText(name, {
    x: 80,
    y: 275,
    size: 65,
    font: embedFontName,
    color: rgb(0.36, 0.54, 0.66),
  });
  firstPage.drawText(`Đã hoàn thành khoá học "` + course + `"`, {
    x: 35,
    y: 210,
    size: 18,
    font: embedFontCourse,
    color: rgb(0, 0, 0),
  });
  firstPage.drawText(`Has successfully completed the course  "` + course + `"`, {
    x: 35,
    y: 180,
    size: 17,
    font: embedFontCourseItalic,
    color: rgb(0.36, 0.54, 0.66),
  });
  firstPage.drawText(location+`, `+ChuoiNgay(formattedDate), {
    x: 75,
    y: 85,
    size: 12,
    font: embedFontDay,
    color: rgb(0, 0, 0),
  });
  firstPage.drawText(XoaDau(location)+", "+formattedDate, {
    x: 90,
    y: 65,
    size: 10,
    font: embedFontDay,
    color: rgb(0.36, 0.54, 0.66),
  });
  firstPage.drawText("Xác nhận tại: oes.vercel.app/certification/"+url, {
    x: 30,
    y: 30,
    size: 10,
    font: embedFontCourseItalic,
    color: rgb(0.36, 0.54, 0.66),
  });
  // Serialize the PDFDocument to bytes (a Uint8Array)
  // const pdfBytes = await pdfDoc.save();
  // console.log("Done creating");

  // // this was for creating uri and showing in iframe

  const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
  //document.getElementById("pdf").src = pdfDataUri;
  document.querySelector("#mypdf").src = pdfDataUri

  // var file = new File(
  //   [pdfBytes],
  //   "Padhega India Subscription Certificate.pdf",
  //   {
  //     type: "application/pdf;charset=utf-8",
  //   }
  // );
  // saveAs(file);
};
function XoaDau(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
}
function ChuoiNgay(str) {
  const date = new Date(str);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const formattedDate = `ngày ${day} tháng ${month} năm ${year}`;
  return formattedDate;
}

generatePDF("Lê Văn Cường", "Lập trình web", "Hồ Chí Minh", "09/5/2023", "blabla")
// init();
