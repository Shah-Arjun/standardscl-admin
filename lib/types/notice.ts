export interface Notice {
  id: number;
  title: string;
  content: string;
  category:
    | "Admissions"
    | "Sports"
    | "Events"
    | "Academic"
    | "Meeting"
    | "Holiday"
    | "News"
    | "Exam"
    | "Result"
    | "General";
  postedBy: "Principal" | "Exam Coordinator" | "Vice Principal";
  createdAt: Date | string;
  updatedAt: Date | string;
}
