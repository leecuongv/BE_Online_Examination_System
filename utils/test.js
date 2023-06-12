const { PDFDocument } = require('pdf-lib');
const admin = require('firebase-admin');
const serviceAccount = require('path/to/serviceAccountKey.json');

// Khởi tạo Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'oes-gencertificate.appspot.com'
});

// Đường dẫn tệp PDF đã chỉnh sửa và tệp PDF mới trong Firebase Storage
const editedPdfPath = 'cert/cert.pdf';
const newPdfPath = 'cert/new.pdf';

// Tạo tệp PDF mới từ tệp PDF đã chỉnh sửa và trả về đường dẫn đến tệp mới
async function createAndUploadNewPDF() {
    // Tải tệp PDF đã chỉnh sửa từ Firebase Storage
    const bucket = admin.storage().bucket();
    const editedPdfFile = bucket.file(editedPdfPath);
    const [editedPdfBuffer] = await editedPdfFile.download();

    // Mở tệp PDF đã chỉnh sửa với pdf-lib
    const editedPdfDoc = await PDFDocument.load(editedPdfBuffer);

    // Tạo tệp PDF mới
    const newPdfDoc = await PDFDocument.create();
    const [copiedPage] = await newPdfDoc.copyPages(editedPdfDoc, [0]);
    newPdfDoc.addPage(copiedPage);

    // Xuất tệp PDF mới
    const newPdfBytes = await newPdfDoc.save();

    // Tải lên tệp PDF mới lên Firebase Storage
    await bucket.file(newPdfPath).save(newPdfBytes);

    // Trả về đường dẫn đến tệp PDF mới
    return `https://storage.googleapis.com/${bucket.name}/${newPdfPath}`;
}

createAndUploadNewPDF()
    .then(newPdfUrl => {
        console.log('Đường dẫn đến tệp PDF mới:', newPdfUrl);
    })
    .catch(error => {
        console.error('Đã xảy ra lỗi:', error);
    });
