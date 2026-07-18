export type ParentEnrollment={tracking_status?:string;parental_tracking_enabled?:boolean;academic_year_classes?:{academic_years?:{name?:string};school_classes?:{name?:string}}}
export type ParentChild={relationship_type:string;is_primary:boolean;student:{public_id:string;matricule?:string;first_name:string;last_name:string;middle_name?:string;gender?:string;birth_date?:string;profile_photo?:string|null;status?:string;student_enrollments?:ParentEnrollment[]}}
export type ParentLesson={lesson_session_id:string;subject:string;teacher:{first_name:string;last_name:string};summary?:string|null;homework?:string|null;observations?:string|null;validation_status:string;start_time?:string|null;end_time?:string|null}
export type ParentAcknowledgement={acknowledged_at:string;lesson_count_snapshot:number;journal_snapshot:unknown;comment?:string|null}
export type ParentJournal={student:{public_id:string;first_name:string;last_name:string};journal_date:string;lessons:ParentLesson[];acknowledgement:ParentAcknowledgement|null}
export type ParentNotification={title:string;message:string;notification_type:string;reference_table?:string|null;is_read:boolean;created_at:string}
export type ParentPage<T>={items:T[];page:number;total:number;pages:number}
export type JournalHistoryItem={date:string;journal:ParentJournal}
