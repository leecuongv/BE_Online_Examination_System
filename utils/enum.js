const ACCOUNT_TYPES = {
    LITE: "LITE",
    PRO: "PRO",
  };
  
  const DEFAULT_VALUES = {
    AVATAR: 'https://1.bp.blogspot.com/-CV8fOXMMw60/YZ-UJ4X9sAI/AAAAAAAACMc/2Svet97exjgNdJ9CeTKUU3OuA-mnCQEzwCLcBGAsYHQ/s595/3a.jpg',
    IMAGE_COURSE:""
  };

const COLLECTION = {
    ANSWER: "Answer",
    BILL: "Bill",
    COURSE: "Course",
    QUESTION: "Question",
    TAKEEXAM: "Take_exam",
    EXAMRESULT: "Exam_result",
    EXAM: "Exam",
    USER: "User",
    QUESTIONBANK: "Question_bank"
  };

const TYPEOFPOINT = {
  MAX:'max',
  AVG:'avg',
  LAST:'last'
}
const VIEWPOINT = {
  NO:'no',
  DONE:'done',
  ALLDONE:'alldone'
}
const VIEWANSWER = {
  NO:'no',
  DONE:'done',
  ALLDONE:'alldone'
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
    ACTIVE:'active',
    INACTIVE:'inactive',
    PUBLIC:'public',
    PRIVATE:'private',
    CLOSE:'close'
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

module.exports= {STATUS,TYPE_ACCOUNT,ROLES,COLLECTION,DEFAULT_VALUES,ACCOUNT_TYPES,TYPEOFPOINT,VIEWPOINT,VIEWANSWER}