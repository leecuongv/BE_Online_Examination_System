const ACCOUNT_TYPES = {
  LITE: "LITE",
  PRO: "PRO",
};

const DEFAULT_VALUES = {
  AVATAR: 'https://1.bp.blogspot.com/-CV8fOXMMw60/YZ-UJ4X9sAI/AAAAAAAACMc/2Svet97exjgNdJ9CeTKUU3OuA-mnCQEzwCLcBGAsYHQ/s595/3a.jpg',
  IMAGE_COURSE: ""
};
const QUESTIONTYPE = {
  SINGLE: "single",
  MULTI: "multi",
  FILLIN: "fillin"
};


const COLLECTION = {
  ANSWER: "Answer",
  BILL: "Bill",
  COURSE: "Course",
  QUESTION: "Question",
  TAKEEXAM: "Take_exam",
  EXAMLOG: "Exam_log",
  EXAM: "Exam",
  USER: "User",
  QUESTIONBANK: "Question_bank",
  LOG: "Logs",
  ASSIGNMENT: "Assignment",
  SUBMITASSIGNMENT: "Submit_assignment",
  PIN: "Pin",
  LESSON: "Lesson",
  TICK: "Tick",
  SEENLESSON: 'Seen_lesson',
  TRANSACTIONHISTORY: "Transaction_history",
  CERTIFICATE: "Certificate",

};

const CERTIFICATION = {
  NOTALLOW: "not allow",
  WHENDONE: "when done",
  WHENCOURSEDONE: "when course done",

}

const TYPEOFPOINT = {
  MAX: 'max',
  AVG: 'avg',
  LAST: 'last'
}
const VIEWPOINT = {
  NO: 'no',
  DONE: 'done',
  ALLDONE: 'alldone'
}
const VIEWANSWER = {
  NO: 'no',
  DONE: 'done',
  ALLDONE: 'alldone'
}

const STATUS = {
  DEACTIVE: 'deactive',
  DELETED: 'deleted',
  OK: 'ok',
  ARCHIVED: 'archived',
  NOT_SUBMITTED: 'not submitted',
  SUBMITTED: 'submitted',
  PASSED: 'passed',
  FAILED: 'failed',
  SUCCESS: 'success',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PUBLIC: 'public',
  PRIVATE: 'private',
  CLOSE: 'close',
  ALLOW: 'allow',
  NOTALLOW: 'not allow',
  PROTECTED: "protected", //Chỉ những sinh viên thuộc khóa học mới có thể xem được
  PAID: "paid",
};

const ROLES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
};
const TYPE_ACCOUNT = {
  NORMAL: "NORMAL",
  GOOGLE: "GOOGLE",
  FACEBOOK: "FACEBOOK",
};
const ANSWERTYPE = {
  EQUAL: "equal",
  INCLUDE: "include"
}
const FEE = {
  FEE: 30
}

const BANK = {
  VIETCOMBANK: "Ngân hàng ngoại thương Việt Nam(VietcomBank)",
  BIDV: "Ngân hàng Đầu tư và Phát triển VN (BIDV)",
  VIETINBANK: "NH Công thương VN (Vietinbank)",
  AGRIBANK: "NH Nông nghiệp &PT Nông thôn VNAGribank",
  PVCOMBANK: "Ngân hàng TMCP Đại A",
  NCB: "Ngân hàng TMCP Quốc Dân",
  VIETABANK: "Ngân hàng TMCP Việt Á",
  BAOVIETBANK: "NH BẢO VIỆT (Bao Viet Bank)",
  TECHCOMBANK: "NHTMCP Kỹ thương VN (Techcombank)",
  NAMABANK: "NHTMCP Nam Á (Nam A Bank)",
  HDBANK: "NHTMCP phát triển Tp HCM (HD Bank)",
  OCB: "NHTMCP Phương Đông (OCB)",
  MB: "NHTMCP Quân Đội (MB)",
  VIB: "NHTMCP Quốc Tế (VIB)",
  SCB: "NHTMCP Sài Gòn (SCB)",
  SHB: "NHTMCP Sài Gòn  Hà Nội (SHB)",
  SACOMBANK: "NHTMCP Sài gòn Thương Tín (Sacombank)",
  SAIGONBANK: "NHTMCP SG Công Thương (SaigonBank)",
  VPBANK: "NHTMCP VN Thịnh Vượng (VP Bank)",
  PGBANK: "NHTMCP Xăng dầu Petrolimex (PGBank)",
  EXIMBANK: "NHTMCP Xuất Nhập Khẩu (Eximbank)",
  PVCOMBANK: "NH Đại Chúng (PVcombank)",
  TIENPHONGBANK: "NH Tiên Phong (Tiên Phong Bank)",
  LIENVIETPOSTBANK: "NH TMCP BƯU ĐIỆN LIÊN VIỆT",
  ACB: "NHTMCP Á Châu (ACB)",
  ABBANK: "NHTMCP An Bình (ABBank)",
  BACABANK: "NHTMCP Bắc Á (Bac A bank)",
  OCEANBANK: "NHTMCP Đại Dương (Oceanbank)",
  GPBANK: "NHTMCP Dầu khí Toàn cầu (GPBank)",
  DONGABANK: "NHTMCP Đông Á (Dong A bank)",
  SEABANK: "NHTMCP Đông Nam Á (Seabank)",
  MARITIMEBANK: "NHTMCP Hàng Hải (Maritime Bank)",
  KIENLONGBANK: "NHTMCP Kiên Long (Kien Long bank)",
}


module.exports = { STATUS, TYPE_ACCOUNT, ROLES, COLLECTION, DEFAULT_VALUES, ACCOUNT_TYPES, TYPEOFPOINT, VIEWPOINT, VIEWANSWER, QUESTIONTYPE, ANSWERTYPE, BANK, CERTIFICATION, FEE }