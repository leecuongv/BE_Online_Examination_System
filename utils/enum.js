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
  SEENLESSON: 'Seen_lesson'
};

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
  PROTECTED: "protected" //Chỉ những sinh viên thuộc khóa học mới có thể xem được

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
  EQUAL:"equal",
  INCLUDE: "include"
}

module.exports = { STATUS, TYPE_ACCOUNT, ROLES, COLLECTION, DEFAULT_VALUES, ACCOUNT_TYPES, TYPEOFPOINT, VIEWPOINT, VIEWANSWER, QUESTIONTYPE, ANSWERTYPE }