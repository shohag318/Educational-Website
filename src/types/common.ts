export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  success: false;
  error?: string;
  message?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | (ApiFailure & { data?: T });

export type IdName = {
  id: string;
  name: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ModuleKey =
  | "session"
  | "student_info"
  | "results"
  | "fees"
  | "accountant"
  | "user_roles"
  | "sms_notice"
  | "downloads"
  | "assets";

export type GroupType = "GENERAL" | "SCIENCE" | "HUMANITIES" | "BUSINESS_STUDIES" | "ALL";
export type ShiftType = "MORNING" | "DAY";
export type SubjectType = "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH";
