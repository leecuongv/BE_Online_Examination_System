const ACCOUNT_TYPES = {
    LITE: "LITE",
    PRO: "PRO",
  };
  
  const DEFAULT_VALUES = {
    AVATAR: 'https://1.bp.blogspot.com/-CV8fOXMMw60/YZ-UJ4X9sAI/AAAAAAAACMc/2Svet97exjgNdJ9CeTKUU3OuA-mnCQEzwCLcBGAsYHQ/s595/3a.jpg',
    IMAGE_COURSE:""
  };

const COLLECTION = {
    ANSWER: "answers",
    BILL: "bills",
    COURSE: "courses",
    QUESTION: "questions",
    TAKETEST: "take_exams",
    TAKETESTLOG: "take_exam_logs",
    TEST: "exams",
    USER: "users",
  };

const STATUS = {
    DEACTIVE: 'deactive',
    DELETED: 'deleted',
    OK: 'ok',
    ARCHIVED: 'archived',
    NOT_SUBMITTED: 'not submitted',
    PASSED: 'passed',
    FAILED: 'failed',
    SUCCESS: 'success',
    ACTIVE:'active',
    INACTIVE:'inactive'
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

export {STATUS,TYPE_ACCOUNT,ROLES,COLLECTION,DEFAULT_VALUES,ACCOUNT_TYPES}