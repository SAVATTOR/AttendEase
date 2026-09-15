# GHANA TECHNOLOGY UNIVERSITY COLLEGE
## (GTUC)
## FACULTY OF INFORMATICS

**TITLE:**

# SMART ATTENDANCE MANAGEMENT SYSTEM: A WEB-BASED SOLUTION WITH QR CODE TECHNOLOGY AND GPS VERIFICATION

**(15)**

A Project Work Submitted in Partial Fulfillment of the Requirements For  
BSc./Diploma in Information Technology  

**(12)**

**BY:**  
[STUDENT NAME]  
**STUDENT ID:** [STUDENT ID]

**SUPERVISOR:**  
[SUPERVISOR NAME]

**[MONTH AND YEAR]**

---

## DECLARATION

This project is presented as part of the requirements for BSc./Diploma in Information Technology awarded by Ghana Technology University College. I hereby declare that this project is entirely the result of hard work, research and enquires. I am confident that this project work is not copied from any other person. All sources of information have however been acknowledged with due respect.

**AUTHOR:** [STUDENT NAME]  
SIGNATURE....................................................................  
**STUDENT ID:** [STUDENT ID]  
DATE:.........................................

**SUPERVISOR:** [SUPERVISOR NAME]  
SIGNATURE....................................................................  
**HOD:** SIGNATURE........................................  
DATE:........................................

---

## ACKNOWLEDGEMENT

First and foremost, I wish to give thanks to the Almighty God for His grace and strength throughout the duration of this project. My sincere appreciation goes to my Supervisor, [Supervisor Name], for the guidance, patience, and invaluable feedback provided during the development of this project. Despite numerous commitments, time was always found to review the work and offer constructive direction.

I extend my gratitude to the Faculty of Informatics and the Department for the resources and support made available during the course of this study. My thanks also go to colleagues and friends who offered technical assistance, shared ideas, and provided encouragement when challenges arose. I am grateful to my family for their unwavering support, understanding, and encouragement throughout this endeavour. To all who have contributed in any way to the completion of this project, whether directly or indirectly, I express my heartfelt thanks. May God bless you all.

---

## ABSTRACT

Traditional attendance management systems in educational institutions face significant challenges including proxy attendance, manual record-keeping errors, and inefficient data processing. Research indicates that manual systems exhibit error rates as high as 15–20% in transcription and are highly vulnerable to proxy attendance, where students mark attendance on behalf of absent peers. This project developed a comprehensive web-based Smart Attendance Management System that leverages dynamic QR code technology, GPS location verification, and real-time communication to address these limitations. The system enables teachers to generate dynamic QR codes for attendance sessions, which regenerate at short intervals to prevent unauthorized sharing. Students scan these codes using their mobile devices, and the system verifies physical presence through GPS coordinates using the Haversine formula for precise distance calculation. The solution utilizes React 18 with TypeScript for the frontend, Node.js with Express for the backend, and PostgreSQL hosted on Supabase for data storage. Multi-layer security measures include rotating QR codes with time-based expiration, GPS geofencing verification, JWT-based authentication, bcrypt password hashing, and duplicate attendance prevention. Real-time communication is achieved through WebSocket technology using Socket.io. The system was tested comprehensively and deployed on cloud infrastructure (Firebase Hosting for frontend, Render for backend). The project contributes to the field of educational technology by demonstrating the effective integration of dynamic QR codes, geospatial validation, and real-time full-stack architectures in attendance management systems.

---

## TABLE OF CONTENTS

| Item | Page |
|------|------|
| Title Page | i |
| Declaration | ii |
| Acknowledgement | iii |
| Abstract | iv |
| Table of Contents | v |
| List of Tables | vi |
| List of Figures | vii |
| List of Abbreviations | viii |
| **Chapter One: Introduction** | **1** |
| 1.1 Background to the Study | 1 |
| 1.2 Statement of the Problem | 5 |
| 1.3 Aim and Objectives | 7 |
| 1.4 Significance of the Study | 8 |
| 1.5 Scope of the Study | 10 |
| 1.6 Organization of the Study | 11 |
| **Chapter Two: Literature Review** | **12** |
| 2.1 Introduction | 12 |
| 2.2 Attendance Management Systems | 13 |
| 2.3 QR Code Technology in Education | 16 |
| 2.4 GPS and Location-Based Verification | 19 |
| 2.5 Web Application Security | 22 |
| 2.6 Real-Time Communication Technologies | 25 |
| 2.7 Database Design for Attendance Systems | 28 |
| 2.8 User Experience in Educational Technology | 30 |
| 2.9 Summary and Research Gaps | 32 |
| **Chapter Three: System Specification and Design** | **34** |
| 3.1 Introduction | 34 |
| 3.2 Software Development Methodology | 35 |
| 3.3 Requirements Analysis | 37 |
| 3.4 System Architecture | 40 |
| 3.5 Data Flow and Process Design | 43 |
| 3.6 Database Design | 46 |
| 3.7 Security Design | 50 |
| **Chapter Four: System Implementation** | **53** |
| 4.1 Choice of Tools and Technologies | 53 |
| 4.2 Frontend Implementation | 57 |
| 4.3 Backend Implementation | 61 |
| 4.4 Database Implementation | 65 |
| 4.5 Security Implementation | 68 |
| 4.6 Real-Time Features | 71 |
| 4.7 Deployment | 74 |
| **Chapter Five: Conclusion and Recommendations** | **77** |
| 5.1 Conclusion | 77 |
| 5.2 Limitations | 79 |
| 5.3 Recommendations | 80 |
| **References** | **82** |
| **Appendices** | **86** |

---

## LIST OF TABLES

| Table | Title | Page |
|-------|-------|------|
| Table 1.1 | Comparison of Manual vs. Digital Attendance Systems | 6 |
| Table 2.1 | Summary of Attendance System Approaches | 15 |
| Table 3.1 | Functional Requirements | 38 |
| Table 3.2 | Non-Functional Requirements | 39 |
| Table 3.3 | Database Entity Summary | 48 |
| Table 4.1 | Technology Stack Summary | 56 |
| Table 5.1 | Objectives and Achievement Summary | 78 |

---

## LIST OF FIGURES

| Figure | Title | Page |
|--------|-------|------|
| Figure 3.1 | System Architecture Diagram | 41 |
| Figure 3.2 | QR Session Flow Diagram | 44 |
| Figure 3.3 | Attendance Marking Process Flow | 45 |
| Figure 3.4 | Entity Relationship Diagram | 49 |
| Figure 3.5 | Security Layers Diagram | 51 |
| Figure 4.1 | Teacher Dashboard – Class List | 58 |
| Figure 4.2 | QR Code Session Interface | 59 |
| Figure 4.3 | Student Attendance Marking Interface | 60 |
| Figure 4.4 | Real-Time Attendance Update | 72 |
| Figure 4.5 | Deployment Architecture | 75 |

**Note on diagram sources:** Figures 3.1, 3.2, 3.3, 3.5, 4.4, and 4.5 are generated from PlantUML source files in the project `diagrams/` folder (see `diagrams/README.md` for file names and how to render). Figure 3.4 uses the ERD screenshot from Supabase. Figures 4.1, 4.2, and 4.3 are screenshots from the application.

---

## LIST OF ABBREVIATIONS

| Abbreviation | Full Form |
|--------------|-----------|
| API | Application Programming Interface |
| CDN | Content Delivery Network |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| CSS | Cascading Style Sheets |
| DFD | Data Flow Diagram |
| ERD | Entity Relationship Diagram |
| GPS | Global Positioning System |
| HTML | Hypertext Markup Language |
| HTTP | Hypertext Transfer Protocol |
| JWT | JSON Web Token |
| LMS | Learning Management System |
| ORM | Object-Relational Mapping |
| QR | Quick Response |
| REST | Representational State Transfer |
| RBAC | Role-Based Access Control |
| SQL | Structured Query Language |
| SSL | Secure Sockets Layer |
| UI | User Interface |
| UX | User Experience |
| UAT | User Acceptance Testing |
| XSS | Cross-Site Scripting |

---

# CHAPTER ONE  
# INTRODUCTION

## 1.1 Background to the Study

Educational institutions worldwide face the persistent challenge of accurately tracking student attendance. Traditional methods, including manual roll calls and paper-based systems, have been the norm for decades. These approaches, while simple to implement, are time-consuming, prone to human error, and vulnerable to fraudulent practices such as proxy attendance. The advancement of web technologies and the widespread proliferation of mobile devices present an opportunity to revolutionise attendance management through automated, secure, and efficient digital solutions.

The domain of attendance management systems has gained significant importance in recent years, particularly with the increased emphasis on accountability and data-driven decision-making in educational institutions. Accurate attendance records are essential for academic administration, compliance reporting, and student performance analysis. Research indicates that manual attendance systems exhibit error rates as high as 15–20% in transcription and are highly vulnerable to proxy attendance, or "buddy punching," where students mark attendance on behalf of absent peers. The hidden costs of manual systems manifest in excessive time faculty members spend on administrative tasks rather than instructional activities.

The integration of modern technologies such as QR codes, GPS location services, and real-time communication protocols offers unprecedented opportunities to enhance the reliability and efficiency of attendance tracking systems. Empirical studies demonstrate that QR-based systems can reduce attendance marking time by more than 60% compared to manual roll calls, with accuracy rates reaching 95–98% under ideal GPS conditions. Geofencing, which creates virtual boundaries around specific coordinates with predefined radii, effectively neutralises most forms of proxy attendance when combined with QR code verification.

This project is motivated by the need to address the limitations of existing attendance management solutions. Current systems often lack robust anti-fraud mechanisms, real-time monitoring capabilities, and comprehensive reporting features. The proposed Smart Attendance Management System leverages cutting-edge web technologies to create a solution that is both secure and user-friendly, addressing the needs of educational institutions while providing an enhanced experience for both teachers and students. The significance of this project extends beyond immediate practical applications; it contributes to the academic understanding of how modern web technologies can be effectively integrated to solve real-world problems in educational administration.

## 1.2 Statement of the Problem

The current state of attendance management in educational institutions presents several critical problems with measurable impacts that this project aims to address.

**Proxy Attendance and Fraud:** Traditional attendance systems are vulnerable to proxy attendance, where students mark attendance on behalf of absent classmates. This undermines the integrity of attendance records and creates inaccurate data for academic and administrative purposes. Static QR codes present a significant security risk, as they can be easily photographed and transmitted to students who are not physically present in the classroom. Existing digital solutions often lack robust mechanisms to verify physical presence, relying solely on single-factor authentication that can be compromised.

**Manual Record-Keeping Errors:** Paper-based and manual attendance systems are prone to human error. Studies indicate that transcription errors and unintentional mistakes can reach rates as high as 15–20% in large classroom settings. These errors include incorrect data entry, lost records, and calculation mistakes, which can have significant consequences for student evaluation, compliance reporting, and institutional decision-making.

**Inefficient Data Processing:** Current attendance management methods often require manual compilation of data. Manual roll calls can take 10–15 minutes for 100 students compared to 1–2 minutes with automated QR-based systems. Report generation can take hours in manual systems versus instant generation in automated solutions. Teachers and administrators spend excessive time on administrative tasks rather than focusing on educational activities; research suggests that automated systems can reduce administrative time by up to 70%.

**Lack of Real-Time Monitoring:** Many existing systems do not provide real-time visibility into attendance patterns. Traditional HTTP request-response cycles require constant polling, which increases server load and introduces latency. Teachers cannot immediately identify absent students or monitor attendance as it occurs, limiting their ability to address attendance issues promptly.

**Limited Security Features:** Existing attendance management solutions often lack comprehensive security measures. Static QR codes can be captured and reused; password-based systems are vulnerable to sharing; and many systems store passwords in plain text or use weak hashing algorithms. The lack of multi-layer security combining QR codes with GPS verification leaves systems vulnerable to sophisticated fraud attempts.

**Poor User Experience:** Many attendance management systems are not user-friendly, requiring extensive training and causing frustration among users. Research indicates that lack of digital literacy among faculty and resistance to change are primary barriers to technology adoption in higher education, leading to low adoption rates and resistance to system implementation.

A comparative summary of limitations is presented in Table 1.1.

**Table 1.1 Comparison of Manual vs. Digital Attendance Systems**

| Limitation | Manual Paper Systems | Isolated Digital Spreadsheets |
|------------|----------------------|------------------------------|
| Error Rate | High (15–20% transcription errors) | Moderate (human data entry) |
| Fraud Vulnerability | High (proxy signing) | High (password sharing) |
| Real-Time Visibility | Non-existent | Delayed/Batch processing |
| Administrative Burden | Extreme (manual compilation) | Moderate (data entry/cleaning) |
| Scalability | Poor (linear effort per student) | Limited (file-size/versioning issues) |
| Compliance Risk | High (unverifiable data) | Moderate (audit trails are weak) |

## 1.3 Aim and Objectives

**Aim:** The aim of this project is to design and develop a comprehensive web-based Smart Attendance Management System that utilizes QR code technology, GPS location verification, and real-time communication to improve the accuracy, efficiency, and security of student attendance tracking in educational institutions.

**Objectives:** The specific objectives of this study are as follows:

1. To analyse existing attendance management systems and identify their limitations, security vulnerabilities, and areas for improvement through comprehensive literature review and system analysis.

2. To design a secure and scalable system architecture that incorporates QR code generation, GPS location verification, real-time communication, and comprehensive data management capabilities.

3. To develop a full-stack web application with a responsive frontend interface for both teachers and students, a robust backend API, and a secure database system that ensures data integrity and prevents fraudulent attendance marking.

4. To implement multi-layer security measures including rotating QR codes, GPS location verification, duplicate attendance prevention, and secure authentication mechanisms to minimise proxy attendance and unauthorised access.

5. To integrate real-time communication features that enable live attendance monitoring, instant notifications, and synchronised data updates across all connected devices.

6. To test the system comprehensively through unit testing, integration testing, and user acceptance testing to ensure reliability, security, and user satisfaction.

7. To deploy the system on cloud infrastructure and document the deployment process, system architecture, user manuals, and technical specifications for future maintenance and scalability.

## 1.4 Significance of the Study

**Benefits to Educational Institutions:** This project provides significant benefits to educational institutions by improving attendance accuracy, reducing administrative workload, and enabling data-driven decision-making. The system helps institutions maintain accurate attendance records for compliance purposes, academic evaluation, and resource planning. Real-time monitoring capabilities enable immediate identification of attendance patterns and issues, allowing for timely intervention. The comprehensive reporting and analytics features provide valuable insights into student attendance trends, enabling institutions to identify at-risk students and implement appropriate support measures. The system's scalability accommodates institutions of various sizes, from small schools to large universities.

**Benefits to Teachers:** Teachers benefit from reduced administrative burden, as the system automates attendance recording and report generation. Real-time monitoring capabilities allow teachers to immediately identify absent students and address attendance issues during class sessions. The intuitive user interface minimises training requirements and improves user satisfaction. The system's security features provide confidence that attendance records are accurate and reliable, supporting fair academic evaluation. Export capabilities enable easy integration with grade books and other teaching tools.

**Benefits to Students:** Students experience a streamlined attendance marking process that is quick and convenient. The mobile-friendly design allows attendance marking from any device with internet connectivity. Clear attendance records and statistics help students track their own attendance patterns and make informed decisions about class participation. The system's security measures ensure that attendance records are fair and accurate, preventing fraudulent practices that could disadvantage diligent students. The transparent reporting system provides students with visibility into their attendance history.

**Academic Contribution:** This project contributes to the academic field of educational technology by demonstrating the effective integration of multiple modern technologies in a practical application. The system serves as a case study for implementing security measures, real-time communication, and responsive web design in educational systems. The project provides insights into the challenges and solutions associated with developing secure, scalable web applications for educational purposes. The comprehensive documentation and testing approach serves as a reference for future research and development in this domain.

## 1.5 Scope of the Study

**Delimitation (What Is Covered):** This project develops a comprehensive web-based attendance management system with the following features: user authentication and role-based access control (Teacher and Student roles); class creation and management by teachers; student enrollment in classes using unique class codes; dynamic QR code generation for attendance sessions; QR code scanning and validation by students; GPS location verification for attendance marking; real-time attendance monitoring and updates; attendance history and records management; comprehensive reporting and analytics; and CSV export functionality for attendance data. The technical scope includes a responsive web application accessible on desktop, tablet, and mobile devices; a RESTful API backend with secure authentication; real-time communication using WebSocket technology; PostgreSQL database with proper normalisation and indexing; and cloud deployment on Firebase Hosting (frontend) and Render (backend), with integration with Supabase for database hosting. Security features include JWT-based authentication, password encryption using bcrypt, rotating QR codes with time-based expiration, GPS location verification with configurable radius, duplicate attendance prevention, rate limiting and session management, and input validation and SQL injection prevention.

**Limitation (Constraints and Exclusions):** The project is subject to the following limitations: time constraints may limit the number of features implemented; advanced features such as automated notifications and integration with external student information systems are considered for future phases; the project utilises free-tier or limited cloud services, which may impose constraints on scalability for very large institutions; the system requires internet connectivity for full functionality and does not support comprehensive offline capabilities; GPS accuracy depends on device capabilities and environmental factors; integration with external systems such as LMS or SIS is considered for future development; and the system is designed for teachers and students, with administrative or parent roles considered for future enhancements.

## 1.6 Organization of the Study

The remainder of this report is structured as follows. Chapter Two provides a comprehensive review of literature related to attendance management systems, QR code technology, GPS-based verification, web application security, real-time communication, and database design, with a focus on their relevance to the proposed system. Chapter Three outlines the system specification and design, including the software development methodology, requirements analysis, system architecture, data flow and process design, database design, and security design. Chapter Four presents the system implementation, including the choice of tools and technologies, frontend and backend implementation, database implementation, security implementation, real-time features, and deployment. Chapter Five concludes the report with a summary of achievements, limitations, and recommendations for future work. References and appendices follow the main chapters.

---

# CHAPTER TWO  
# LITERATURE REVIEW

## 2.1 Introduction

This chapter examines existing research and implementations in attendance management systems, QR code technology, GPS-based verification, web application security, real-time communication, and database design. The literature review establishes the theoretical and empirical foundation for the Smart Attendance Management System and identifies critical gaps that this project addresses. By exploring these areas, the study aims to understand the current landscape of attendance solutions, their benefits, challenges, and the potential for innovation in the context of educational institutions.

The review is organised into several key themes: attendance management systems and their evolution; QR code technology and its application in education; GPS and location-based verification; web application security and authentication; real-time communication technologies; database design for attendance systems; and user experience considerations in educational technology. Each theme is discussed with reference to published research, industry practices, and relevant standards. The chapter concludes with a summary of research gaps and how the present project contributes to filling those gaps.

## 2.2 Attendance Management Systems

Research indicates that manual attendance systems exhibit error rates as high as 15–20% in transcription and are highly vulnerable to proxy attendance. Studies comparing different attendance tracking methods reveal that automated systems can reduce administrative time by up to 70% and improve accuracy significantly. The transition toward automated, smart attendance management systems represents a broader shift toward data-driven academic discipline and institutional transparency. Comparative analysis shows that QR-based systems can reduce attendance marking time by more than 60% compared to manual roll calls.

Several approaches to digital attendance management have been implemented in educational institutions. RFID-based systems utilise radio frequency identification tags to automatically record attendance, but they require specialised hardware and infrastructure. Biometric systems, including fingerprint and facial recognition, offer high security but involve significant implementation costs and privacy concerns. Research indicates that biometric systems achieve 93–99% accuracy but introduce substantial hardware costs and persistent ethical concerns regarding biometric data storage. Mobile-based attendance systems have gained popularity due to the ubiquity of smartphones; these systems typically use mobile applications that allow students to check in using various methods including GPS location, QR codes, or manual entry. However, many existing mobile attendance systems lack robust anti-fraud mechanisms and real-time synchronisation capabilities.

Web-based attendance systems offer the advantage of platform independence, requiring only a web browser for access. These systems can be accessed from any device with internet connectivity, eliminating the need for native mobile applications. However, existing web-based solutions often have limitations in terms of security features, real-time updates, and comprehensive reporting. A comparative summary of attendance system approaches is presented in Table 2.1.

**Table 2.1 Summary of Attendance System Approaches**

| Approach | Accuracy | Cost | Hardware | Anti-Fraud | Real-Time |
|----------|----------|------|----------|------------|-----------|
| Manual roll call | Low | Low | None | Weak | No |
| Paper sheets | Low | Low | None | Weak | No |
| RFID | High | High | Tags/readers | Moderate | Yes |
| Biometric | Very High | Very High | Sensors | High | Yes |
| QR code (static) | Moderate | Low | None | Weak | Possible |
| QR + GPS (dynamic) | High | Low | None | High | Yes |

The literature identifies critical gaps: the lack of integrated solutions combining dynamic QR codes with GPS verification, insufficient real-time capabilities in existing systems, and limited research on scalable architectures for high-concurrency attendance marking. This project addresses these gaps through a comprehensive approach integrating dynamic QR codes, geospatial validation, and real-time full-stack architectures.

Furthermore, the evolution of attendance systems from paper-based to digital has been driven by the need for accountability, audit trails, and integration with other institutional systems such as grade books and student information systems. Manual systems not only suffer from high error rates but also create bottlenecks during class time, as teachers must allocate several minutes to roll call in large classes. Automated systems free up instructional time and provide immediate visibility into who is present or absent. The adoption of mobile-first and web-based solutions has accelerated in recent years due to the ubiquity of smartphones and the availability of low-cost cloud infrastructure, making it feasible for institutions of varying sizes to deploy digital attendance solutions without heavy capital investment in hardware such as RFID readers or biometric devices.

## 2.3 QR Code Technology in Education

Literature demonstrates that static QR codes present significant security risks, as they can be easily photographed and transmitted to unauthorised users. Dynamic QR code protocols that incorporate time-sensitive parameters and session-specific tokens, regenerating at intervals of 15–30 seconds, effectively mitigate this vulnerability. Research on QR code-based attendance systems indicates that accuracy of data capture is significantly improved, as the system automatically timestamps and logs each scan directly into a centralised database, eliminating manual recording errors. Some frameworks validate scans against device identifiers, ensuring that students cannot log in to multiple accounts on the same device in a way that facilitates fraud.

QR codes (Quick Response codes) are two-dimensional barcodes that can store information such as URLs, text, or identifiers. They are widely used in education for access to learning materials, event registration, and attendance marking. The key advantage of QR codes for attendance is that they can be generated dynamically and linked to a specific session, time, and location. When combined with short expiration times, they become difficult to share or reuse by absent students. Studies have shown that time-limited QR codes significantly reduce proxy attendance compared to static codes or manual sign-in sheets.

The technical implementation of QR-based attendance typically involves: (1) server-side generation of a unique token or payload for each session; (2) encoding the payload into a QR image; (3) displaying the QR code to the teacher or on a screen; (4) student scanning via camera; (5) decoding and sending the payload to the server; and (6) server validation of the token (e.g., session ID, expiry time) before recording attendance. This workflow forms the basis of the QR component of the Smart Attendance Management System described in this report.

In addition to security benefits, QR codes offer accessibility advantages: they do not require specialised hardware beyond a camera-equipped device, which most students already possess in the form of a smartphone. This reduces the digital divide and ensures that institutions do not need to invest in costly reader infrastructure. The use of standard web libraries such as html5-qrcode allows the scanning functionality to be embedded directly in a web page, enabling a consistent experience across devices and operating systems. The combination of dynamic token rotation and short expiration windows (e.g., 15–30 seconds) has been shown in the literature to significantly reduce the feasibility of sharing codes with absent peers, as the code would need to be transmitted and scanned within a very short time window, and the physical presence requirement (when combined with GPS) further reinforces the integrity of the attendance record.

## 2.4 GPS and Location-Based Verification

Studies on location-based verification systems indicate that GPS-based systems achieve accuracy rates of 95–98% under ideal conditions. The Haversine formula is commonly used for calculating distances between geographic coordinates, accounting for Earth's curvature to determine great-circle distances. Research shows that GPS accuracy varies significantly: ideal outdoor conditions achieve 5–10 metres accuracy, moderate indoor conditions achieve 15–30 metres, while poor conditions (e.g., underground or basement) may exceed 50 metres. Hybrid location services supplement GPS data with Wi-Fi positioning and cellular tower triangulation to maintain stable proximity verification in challenging environments. Geofencing creates virtual boundaries around specific coordinates with predefined radii, effectively neutralising most forms of proxy attendance when combined with QR code verification.

The Haversine formula is preferred over simple Euclidean distance for geographic coordinates because it accounts for the curvature of the Earth. Given two points (lat1, lon1) and (lat2, lon2), the formula returns the distance in metres (or other units) along the surface of the Earth. By comparing the distance between the student's reported location and the session location (e.g., classroom) against a configurable radius (e.g., 50 metres), the system can reject attendance attempts from outside the allowed area. This dual verification—valid QR token plus within-radius location—greatly reduces the feasibility of proxy attendance.

Limitations of GPS in indoor or dense urban environments are acknowledged in the literature. The system design therefore allows configurable radius values and, where appropriate, can be extended in future work to support Wi-Fi or cellular-based location when GPS is unreliable. For typical classroom scenarios where students are expected to be on campus, GPS with a reasonable radius (e.g., 50 m) has been found sufficient in practice.

The dual verification approach—valid QR token plus within-radius location—addresses a key weakness of QR-only systems: a student could photograph a valid QR code and send it to an absent peer, who could then scan it from a remote location. By requiring that the scan be accompanied by coordinates that fall within a predefined radius of the session location, the system ensures that the person marking attendance is physically proximate to the classroom or designated venue. This does not eliminate all forms of collusion (e.g., a student could hand their device to a peer who is present), but it significantly raises the bar for proxy attendance and has been adopted in several commercial and academic attendance solutions described in the literature.

## 2.5 Web Application Security

Literature on authentication mechanisms emphasises the importance of bcrypt for password hashing, which is designed to be computationally expensive and resistant to brute-force attacks. Bcrypt incorporates unique salts for every password hash, preventing rainbow table attacks. Stateless authentication with JSON Web Tokens (JWT) enables scalable session management without database queries for every request. Research recommends storing JWTs in HttpOnly and Secure cookies to prevent XSS attacks, with short expiration times (e.g., 5–15 minutes) combined with refresh token rotation. Role-Based Access Control (RBAC) ensures users only have access to functionality relevant to their role. Threat modelling frameworks like STRIDE help identify and mitigate security vulnerabilities during architecture design.

SQL injection prevention is achieved through the use of parameterised queries or an ORM (Object-Relational Mapping) that abstracts raw SQL; the Smart Attendance system uses Prisma ORM for this purpose. Cross-Site Scripting (XSS) is mitigated by proper output encoding and security headers (e.g., Helmet.js). Cross-Origin Resource Sharing (CORS) is configured to restrict API access to trusted origins. Rate limiting (e.g., on login and sensitive endpoints) reduces the risk of brute-force and denial-of-service attacks. These measures form part of the multi-layer security design described in Chapter Three and implemented in Chapter Four.

## 2.6 Real-Time Communication Technologies

Studies demonstrate that WebSocket technology, particularly through Socket.io, enables persistent, full-duplex communication between server and client, significantly outperforming traditional HTTP polling. Node.js is particularly suited for managing thousands of concurrent WebSocket connections due to its asynchronous nature. Comparative studies show that Node.js and Socket.io architectures significantly outperform traditional request-response environments in terms of real-time speed and reduced CPU utilisation. When a student marks attendance, the backend can emit socket events to instructor dashboards, updating the UI instantly without page refresh.

Traditional HTTP request-response cycles require the client to repeatedly poll the server for updates, which increases server load and introduces latency. WebSockets allow the server to push updates to connected clients as soon as they occur, providing a better user experience for live dashboards (e.g., teachers viewing attendance as it is marked). Socket.io is a popular library that provides a WebSocket-like API with fallbacks and room-based broadcasting, making it suitable for scenarios where only certain users (e.g., those viewing a specific class session) need to receive updates. The Smart Attendance system uses Socket.io for real-time attendance updates on the teacher dashboard.

## 2.7 Database Design for Attendance Systems

Literature emphasises the importance of database normalisation to prevent duplication and ensure referential integrity. Sophisticated indexing strategies are required for performance as datasets grow; columns used frequently in filtering (e.g., student_id, session_date, class_id) require B-Tree indexes. Table partitioning can split attendance records by semester or academic year, preventing single tables from becoming unmanageably large. For high-volume logging, hybrid approaches may utilise time-series or NoSQL databases for write-heavy workloads while maintaining structured enrollment data in relational databases. In this project, a relational model (PostgreSQL) with appropriate indexes and unique constraints (e.g., one attendance record per student per session) is used to ensure data integrity and support reporting and export.

Entity-relationship design for attendance systems typically includes: users (with roles such as teacher and student), classes, enrollments (student-class relationships), sessions (e.g., QR sessions with location and time), and attendance records (linking student, class, session, location, and status). The schema designed for the Smart Attendance system is presented in Chapter Three and implemented in Chapter Four.

## 2.8 User Experience in Educational Technology

Research on educational technology applications emphasises simplicity (e.g., one-click or minimal-step attendance marking), visual feedback (e.g., "Scan Successful" confirmations), high contrast and screen-reader support for accessibility, and personalisation (e.g., dashboards showing current attendance percentages). Responsive Web Design (RWD) principles ensure the UI adapts to device screen size, context, and bandwidth. Gamification elements such as progress bars, badges, and leaderboards can improve student engagement and accountability. Barriers to technology adoption in education include lack of digital literacy among faculty, resistance to change, unstable campus networks, and poor GPS signals in some environments; success factors include institutional support, training, and clear administrative policies. The Smart Attendance system is designed with a responsive, role-based UI and clear feedback to support adoption and usability.

## 2.9 Summary and Research Gaps

The literature review identifies the following critical gaps: (1) the lack of integrated solutions combining dynamic QR codes with GPS verification in a single web-based system; (2) insufficient real-time capabilities in many existing attendance systems; and (3) limited documentation of scalable, full-stack architectures for high-concurrency attendance marking. This project addresses these gaps by developing a comprehensive web-based Smart Attendance Management System that integrates dynamic QR codes, geospatial validation (Haversine formula, configurable radius), JWT-based authentication, bcrypt password hashing, real-time WebSocket updates via Socket.io, and a normalised PostgreSQL schema with appropriate indexes and constraints. The next chapter presents the system specification and design based on these findings.

---

# CHAPTER THREE  
# SYSTEM SPECIFICATION AND DESIGN

## 3.1 Introduction

This chapter illustrates the procedures and design decisions used to achieve the objectives of this study. It covers the software development methodology, requirements analysis, system architecture, data flow and process design, database design, and security design. Each section provides an in-depth look at the steps and processes involved in specifying and designing the Smart Attendance Management System. By detailing these methods and design choices, this chapter aims to provide a comprehensive understanding of how the proposed system was specified and designed to be effective, efficient, secure, and user-friendly.

The development of an attendance management system is a multifaceted project that requires a well-structured approach. This chapter begins by discussing the chosen software development methodology (Agile), which serves as the foundation for organising and managing the project's activities. Next, it outlines the functional and non-functional requirements derived from the problem statement and literature review. The system architecture section describes the high-level structure of the application (frontend, backend, database, real-time layer). The data flow and process design section describes how data moves through the system (e.g., QR session creation, attendance marking, real-time updates). The database design section details the entity-relationship model and schema. Finally, the security design section describes the multi-layer security measures (authentication, authorisation, QR rotation, GPS verification, input validation, rate limiting). By providing a detailed account of these procedures, this chapter demonstrates the rigorous and systematic approach taken to design a system tailored to the needs of educational institutions.

## 3.2 Software Development Methodology

For this project, the Agile methodology was selected due to its iterative nature, flexibility, and focus on continuous improvement. Agile allows for rapid development and the ability to adapt to changes quickly, which is essential in a project of this nature. The key principles of Agile methodology applied in this study include: iterative development, with the project broken down into smaller units (sprints) involving planning, development, testing, and review; collaboration with stakeholders (teachers and students) to ensure the system met user requirements; flexibility to accommodate changes in requirements and priorities; customer feedback through frequent releases and user testing; incremental improvement, with each iteration building on the previous one; transparency, with progress and challenges communicated to stakeholders; and simplicity, focusing on essential features and avoiding unnecessary complexity.

The development process was divided into phases: (1) requirements analysis and design, including system architecture, database schema, and security design; (2) backend development, including API endpoints, authentication, QR and attendance logic, and GPS verification; (3) frontend development, including teacher and student interfaces, QR display and scanning, and real-time updates; (4) integration and testing, including unit tests, integration tests, and user acceptance testing; and (5) deployment and documentation, including cloud deployment (Firebase, Render, Supabase) and preparation of user and technical documentation. This structured yet flexible approach allowed the delivery of a system that is functional, efficient, and adaptable to future enhancements.

## 3.3 Requirements Analysis

**Functional Requirements:** The system shall allow teachers to register and log in, create and manage classes, generate unique class codes for enrollment, start and end QR-based attendance sessions with configurable duration and location, view real-time attendance as students mark attendance, and export attendance data (e.g., CSV). The system shall allow students to register and log in, join classes using a unique class code, view their enrolled classes, scan a QR code and submit location to mark attendance for an active session, view their attendance history and statistics, and update profile and settings. The system shall validate QR tokens (session ID, expiry), verify student location against session location using a configurable radius (Haversine formula), prevent duplicate attendance per student per session, and enforce role-based access (teacher vs. student). Table 3.1 summarises the main functional requirements.

**Table 3.1 Functional Requirements**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | User registration and login (teacher, student) | High |
| FR2 | Class creation and management by teacher | High |
| FR3 | Student enrollment via class code | High |
| FR4 | Dynamic QR session creation with location and expiry | High |
| FR5 | QR scan and attendance submission with GPS verification | High |
| FR6 | Real-time attendance updates on teacher dashboard | High |
| FR7 | Attendance history and statistics for students | Medium |
| FR8 | CSV export of attendance data | Medium |
| FR9 | Profile and settings management | Low |

**Non-Functional Requirements:** The system shall be easy to maintain, compatible with modern web browsers and mobile devices, responsive to user actions with acceptable response times (e.g., API responses within a few hundred milliseconds where feasible), available when hosted on reliable cloud infrastructure, and secure (authentication, encryption, input validation, rate limiting). It shall be accessible to authorised users via standard web interfaces and easy to learn for both teachers and students, with clear navigation and feedback. Table 3.2 summarises the main non-functional requirements.

**Table 3.2 Non-Functional Requirements**

| ID | Requirement | Category |
|----|-------------|----------|
| NFR1 | Responsive UI (desktop, tablet, mobile) | Usability |
| NFR2 | JWT-based authentication; bcrypt for passwords | Security |
| NFR3 | Input validation and SQL injection prevention | Security |
| NFR4 | Rate limiting on auth and sensitive endpoints | Security |
| NFR5 | Real-time updates via WebSocket | Performance |
| NFR6 | Database indexing for frequent queries | Performance |
| NFR7 | Deployable on cloud (Firebase, Render, Supabase) | Deployment |

## 3.4 System Architecture

The Smart Attendance Management System is designed as a three-tier web application: (1) Presentation layer (frontend), (2) Application layer (backend API and WebSocket server), and (3) Data layer (database). The frontend is a single-page application (SPA) built with React and TypeScript, served via Firebase Hosting. The backend is a Node.js application using Express.js for REST API and Socket.io for WebSocket, deployed on Render. The database is PostgreSQL hosted on Supabase, accessed by the backend via Prisma ORM. Figure 3.1 illustrates the high-level system architecture.

**Figure 3.1 System Architecture Diagram**

The architecture diagram shows: Frontend (React Application) deployed on Firebase Hosting; Backend (Express.js Server) deployed on Render; Database (PostgreSQL) hosted on Supabase; External services such as Google Maps API (for location display) and Socket.io for WebSocket. The React application communicates with the backend via HTTP/REST for API calls and via WebSocket (Socket.io) for real-time attendance updates. The backend communicates with the database via Prisma ORM. The frontend may use Google Maps (or similar) for displaying or confirming location when required.

**Data Flow for QR Session:** The teacher starts a session from the dashboard; the frontend requests the backend to create a QR session (class ID, location, duration). The backend creates a QRSession record with a unique token and expiry time, stores session location (latitude, longitude), and returns session details to the frontend. The frontend displays a QR code encoding the token (and optionally session ID) and refreshes it at short intervals (e.g., every 5 seconds). Figure 3.2 illustrates the QR session flow.

**Figure 3.2 QR Session Flow Diagram**

**Data Flow for Attendance Marking:** The student opens the attendance marking interface, scans the QR code, and the frontend decodes the token and requests the student's current location (GPS). The frontend sends to the backend: token, student ID (from auth), latitude, longitude. The backend validates the token (exists, not expired, session active), verifies the student is enrolled in the class, computes distance from student location to session location using the Haversine formula, checks that distance is within the allowed radius, and creates an Attendance record (or returns an error if duplicate or invalid). The backend emits a real-time event (e.g., via Socket.io) to the teacher's room so the dashboard updates. Figure 3.3 illustrates the attendance marking process flow.

**Figure 3.3 Attendance Marking Process Flow**

## 3.5 Data Flow and Process Design

The main processes in the system are: (1) Authentication—user registration, login, token issuance, session management; (2) Class and enrollment management—teacher creates class and code, student joins with code, enrollment status (e.g., approved) stored; (3) QR session lifecycle—create, activate, optionally pause/resume, end; (4) Attendance marking—validate token, verify location, insert attendance, broadcast update; (5) Reporting and export—query attendance by class/session/date, generate CSV. Data flow diagrams (DFDs) can be used to represent these processes at context level (system vs. external entities: teacher, student) and at level 1 (sub-processes such as "Validate QR", "Verify Location", "Record Attendance"). The design ensures that sensitive operations (e.g., creating attendance) are only performed after validation of token and location, and that duplicate attendance is prevented by database unique constraint on (studentId, qrSessionId).

## 3.6 Database Design

The database is designed using a relational model implemented in PostgreSQL. The main entities are: User (id, email, password, name, role, indexNumber, session, program, isEmailVerified, timestamps); UserSettings (userId, emailNotifications, sessionReminders, defaultSessionDuration, defaultAllowedRadius, lateThresholdMinutes); LoginSession (userId, token, deviceId, loginAt, expiresAt, isActive); Class (id, name, description, code, teacherId, schedule, allowedRadius, lateThresholdMinutes, sessionDurationMins, isActive, timestamps); Enrollment (studentId, classId, status, enrolledAt); QRSession (id, classId, token, latitude, longitude, status, createdAt, expiresAt, pausedAt, resumedAt, endedAt); Attendance (id, studentId, classId, qrSessionId, latitude, longitude, distance, status, markedAt, deviceInfo). Relationships: User has many LoginSessions, Enrollments, Attendances; User (teacher) has many Classes; Class has many Enrollments, QRSessions, Attendances; QRSession has many Attendances; Enrollment links User (student) and Class; Attendance links User (student), Class, and QRSession. Enums: Role (STUDENT, TEACHER), AttendanceStatus (PRESENT, LATE, ABSENT, INVALID_LOCATION), SessionStatus (ACTIVE, PAUSED, ENDED, EXPIRED), EnrollmentStatus (PENDING, APPROVED, REJECTED). Key constraints: unique (studentId, classId) on Enrollment; unique (studentId, qrSessionId) on Attendance to prevent duplicate attendance; indexes on frequently queried columns (e.g., userId, classId, qrSessionId, markedAt). Table 3.3 summarises the main entities.

**Table 3.3 Database Entity Summary**

| Entity | Purpose |
|--------|---------|
| User | Accounts for teachers and students; stores auth and profile data |
| UserSettings | User preferences (e.g., default radius, session duration) |
| LoginSession | Active login sessions and tokens for auth |
| Class | Class metadata and settings (code, radius, duration) |
| Enrollment | Student-class relationship and status |
| QRSession | Active or ended QR session with location and token |
| Attendance | Single attendance record per student per session |

**Figure 3.4 Entity Relationship Diagram**

The ER diagram (Figure 3.4) shows the entities and relationships described above. The schema supports the functional requirements: teachers and students as users with roles; classes and enrollments for course structure; QR sessions for time-bounded, location-based attendance; and attendance records with location and status for reporting and export.

## 3.7 Security Design

Security is designed in multiple layers. (1) Authentication: Passwords are hashed with bcrypt (salt rounds configurable); JWT is used for stateless authentication with configurable expiry; login sessions can be stored (e.g., LoginSession) for optional revocation or audit. (2) Authorisation: Role-based access control (RBAC)—teachers can create classes and sessions; students can join classes and mark attendance; API middleware checks role and resource ownership. (3) QR and attendance: Tokens are generated with sufficient entropy and expire shortly (e.g., 30 seconds or aligned with QR refresh); each session has a unique token; attendance is only accepted when token is valid and location is within radius. (4) Input validation: All API inputs are validated (e.g., email format, required fields, numeric ranges for coordinates and radius); invalid input is rejected with clear error messages. (5) SQL injection prevention: Prisma ORM uses parameterised queries; raw SQL is avoided for user-supplied data. (6) Rate limiting: Applied on authentication and sensitive endpoints to reduce brute-force and abuse. (7) CORS and headers: CORS is configured to allow only trusted origins; security headers (e.g., Helmet.js) are used to mitigate XSS and related risks. Figure 3.5 illustrates the security layers.

**Figure 3.5 Security Layers Diagram**

This multi-layer design ensures that the system is resilient against common threats (proxy attendance, token reuse, brute-force, injection, XSS) while remaining maintainable and auditable. The next chapter describes how this design was implemented using the chosen tools and technologies.

---

# CHAPTER FOUR  
# SYSTEM IMPLEMENTATION

## 4.1 Choice of Tools and Technologies

This chapter presents the various tools and technologies used in implementing the Smart Attendance Management System. The implementation follows the architecture and design described in Chapter Three and utilises current web technologies suitable for a full-stack, real-time, and secure application.

**Frontend:** React 18 with TypeScript was chosen for the user interface. React provides a component-based architecture, a large ecosystem, and strong support for real-time updates and state management. TypeScript adds type safety and improves maintainability. Vite was used as the build tool and development server for fast builds and hot module replacement. Tailwind CSS was used for responsive styling and consistent design. React Router v6 was used for client-side routing and protected routes based on user roles. Socket.io Client was used for WebSocket connection to the backend for real-time attendance updates. The html5-qrcode library was used for QR code scanning via the device camera. TanStack Query (React Query) was used for server state management, caching, and refetching of API data.

**Backend:** Node.js was chosen as the runtime environment for its asynchronous, event-driven model, which is well-suited for I/O-heavy workloads and WebSocket connections. Express.js was used as the web framework for building the REST API and mounting middleware (authentication, validation, error handling). Prisma was used as the ORM for type-safe database access, migrations, and schema management. Socket.io was used for the WebSocket server to broadcast real-time attendance events to teacher dashboards. JWT (jsonwebtoken) was used for stateless authentication. bcryptjs was used for password hashing. Helmet.js was used for HTTP security headers. express-rate-limit was used for rate limiting on authentication and sensitive endpoints. CORS was configured to allow requests only from the frontend origin.

**Database:** PostgreSQL was chosen for relational data storage, ACID compliance, and support for complex queries and indexing. Supabase was used for managed PostgreSQL hosting, connection pooling, and backups. Prisma migrations were used for schema versioning and deployment.

**Deployment:** Firebase Hosting was used for frontend deployment, providing global CDN distribution and automatic SSL. Render was used for backend deployment as a web service with automatic deployments from the repository. Supabase hosted the PostgreSQL database. Environment variables were used for configuration (e.g., database URL, JWT secret, API URLs) in development and production.

Table 4.1 summarises the technology stack.

**Table 4.1 Technology Stack Summary**

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18, TypeScript, Vite | UI and build |
| Frontend | Tailwind CSS, React Router | Styling and routing |
| Frontend | Socket.io Client, html5-qrcode | Real-time and QR scan |
| Backend | Node.js, Express.js | API and WebSocket server |
| Backend | Prisma, PostgreSQL (Supabase) | Data access and storage |
| Backend | JWT, bcryptjs, Helmet, rate-limit | Auth and security |
| Deployment | Firebase Hosting, Render, Supabase | Hosting and database |

## 4.2 Frontend Implementation

The frontend was implemented as a single-page application (SPA) with distinct views for teachers and students. Teachers access a dashboard where they can create and manage classes, start and end QR-based attendance sessions, view real-time attendance as students mark attendance, and export attendance data (CSV). Students access a dashboard where they can join classes using a unique class code, view their enrolled classes, scan a QR code and submit location to mark attendance, and view their attendance history and statistics.

**Teacher Dashboard:** The teacher dashboard includes: a list of classes with options to create, edit, and delete; for each class, an option to start a QR session (with optional duration and location); a session view that displays a dynamic QR code (refreshed at short intervals) and a live list of students who have marked attendance; and an export option to download attendance data as CSV. The QR code is generated by encoding a token (or session ID and token) returned by the backend; the frontend refreshes the token and re-encodes the QR at a configurable interval (e.g., 5 seconds). Real-time updates are received via Socket.io: when a student marks attendance, the backend emits an event to the room associated with the class/session, and the teacher's dashboard updates the list without page refresh.

**Student Interface:** The student interface includes: a list of enrolled classes; for each class, an option to "Mark Attendance" which opens the QR scanner and requests location permission; after scanning the QR code and obtaining location, the frontend sends the token and coordinates to the backend; on success, the user sees a confirmation (e.g., "Attendance marked successfully"); on failure (e.g., invalid token, out of range), the user sees an appropriate error message. The student can also view attendance history and statistics (e.g., percentage present) for each class.

**Authentication and Routing:** Login and registration forms collect email and password (and name, role where applicable). On successful login, the backend returns a JWT (and optionally user profile); the frontend stores the token (e.g., in memory or secure storage) and includes it in the Authorization header for subsequent API requests. Protected routes check for the presence of a valid token and redirect unauthenticated users to the login page. Role-based routing ensures teachers see the teacher dashboard and students see the student dashboard.

Figure 4.1 illustrates the teacher dashboard (class list). Figure 4.2 illustrates the QR code session interface. Figure 4.3 illustrates the student attendance marking interface.

**Figure 4.1 Teacher Dashboard – Class List**  
**Figure 4.2 QR Code Session Interface**  
**Figure 4.3 Student Attendance Marking Interface**

## 4.3 Backend Implementation

The backend was implemented as a Node.js application using Express.js. The application structure includes: routes (auth, classes, QR sessions, attendance, settings, export); controllers (to handle request/response and call services); services (business logic for auth, classes, QR sessions, attendance, location verification); middleware (authentication, validation, error handling); and configuration (database, environment, Socket.io).

**Authentication:** Registration and login endpoints validate input (email, password), hash passwords with bcrypt, and issue JWT on successful login. Login sessions can be stored in the LoginSession table for optional revocation. Middleware extracts the JWT from the Authorization header (or cookie), verifies the signature and expiry, and attaches the user to the request object. Protected routes use this middleware to ensure only authenticated users (and optionally specific roles) can access the endpoint.

**Classes and Enrollments:** Class creation requires a teacher role; the endpoint creates a Class record with a unique code (generated or provided). Student enrollment uses the class code to look up the class and create an Enrollment record (e.g., status PENDING or APPROVED). Endpoints for listing classes (for teacher: own classes; for student: enrolled classes) and updating class details were implemented.

**QR Sessions:** Starting a session requires the teacher to be the owner of the class. The endpoint creates a QRSession record with a unique token, session location (latitude, longitude), status ACTIVE, and expiry time (e.g., now + session duration). The token is returned to the frontend for encoding into the QR code. Endpoints for pausing, resuming, and ending the session update the QRSession status and timestamps. Token validation (for attendance marking) checks that the token exists, is not expired, and the session is ACTIVE.

**Attendance Marking:** The attendance marking endpoint receives token, latitude, and longitude (student ID from auth). The backend validates the token, retrieves the QRSession and associated Class, verifies the student is enrolled and (if applicable) approved, computes distance from (latitude, longitude) to session location using the Haversine formula, and checks that distance is within the class's allowedRadius. If valid, the backend creates an Attendance record with status PRESENT (or LATE if beyond late threshold); if out of range, status INVALID_LOCATION and no record or an error is returned. Duplicate attendance is prevented by the unique constraint (studentId, qrSessionId). After creating an attendance record, the backend emits a Socket.io event (e.g., "new-attendance") to the room for that class/session so the teacher dashboard can update.

**Export:** An export endpoint (e.g., CSV) allows teachers to download attendance data for a class and date range. The endpoint queries Attendance (and related User, Class, QRSession) and returns the data in CSV format with appropriate headers. The export functionality supports filtering by class, date range, and optionally by session, enabling teachers to generate reports for administrative purposes, grade books, or compliance. Large exports are handled with streaming or pagination where necessary to avoid memory and timeout issues.

**Settings and Profile:** Endpoints for updating user profile (name, index number, session, program) and user settings (e.g., default session duration, default allowed radius, late threshold, notification preferences) were implemented. These settings are used to personalise the experience and to provide default values when creating classes or starting sessions. Password change endpoints validate the current password and update the hashed password in the database.

## 4.4 Database Implementation

The database was implemented in PostgreSQL using the schema defined in Chapter Three. Prisma was used to define the schema (models, enums, relations, indexes) and to generate migrations. The schema includes: User, UserSettings, LoginSession, Class, Enrollment, QRSession, Attendance. Enums used are Role (STUDENT, TEACHER), AttendanceStatus (PRESENT, LATE, ABSENT, INVALID_LOCATION), SessionStatus (ACTIVE, PAUSED, ENDED, EXPIRED), EnrollmentStatus (PENDING, APPROVED, REJECTED). Unique constraints include (studentId, classId) on Enrollment and (studentId, qrSessionId) on Attendance. Indexes were added on frequently queried columns (e.g., userId, classId, qrSessionId, markedAt) to support performance. The database URL and connection pooling are configured via environment variables for local and Supabase-hosted instances.

## 4.5 Security Implementation

Security was implemented as designed in Chapter Three. Passwords are hashed with bcrypt (e.g., 10 salt rounds). JWT is issued with a configurable secret and expiry (e.g., 7 days). Input validation is performed on all relevant endpoints (e.g., email format, required fields, numeric ranges for coordinates and radius). Prisma ORM ensures parameterised queries, preventing SQL injection. Helmet.js sets security-related HTTP headers. CORS is configured to allow only the frontend origin. Rate limiting (e.g., express-rate-limit) is applied on login and optionally on other sensitive endpoints (e.g., 10 requests per 15 minutes for auth). QR tokens are generated with sufficient entropy and short expiry; duplicate attendance is prevented by the database unique constraint. GPS verification uses the Haversine formula and configurable radius; requests outside the radius are rejected with an appropriate error and (if applicable) status INVALID_LOCATION.

## 4.6 Real-Time Features

Real-time attendance updates were implemented using Socket.io. When a teacher starts a QR session, the frontend joins a room (e.g., class ID or session ID). When a student marks attendance, the backend creates the Attendance record and then emits an event (e.g., "new-attendance") to that room with relevant data (e.g., student name, timestamp). The teacher's client listens for this event and updates the UI (e.g., appends the student to the live attendance list) without page refresh. Optional events such as "qr-refreshed" can be used to signal QR code updates if the backend rotates the token. The WebSocket connection is established after the user is authenticated; the client can send the JWT in the handshake or in a follow-up message for server-side authorisation of room joins.

Figure 4.4 illustrates the real-time attendance update flow.

**Figure 4.4 Real-Time Attendance Update**

## 4.7 Deployment

The system was deployed on cloud infrastructure as follows. The frontend was built with Vite (e.g., npm run build) and the output (e.g., dist/) was deployed to Firebase Hosting. The backend was deployed to Render as a web service; the service runs Node.js (e.g., node server.js or npm start), with the repository connected for automatic deployments on push. Environment variables (DATABASE_URL, JWT_SECRET, FRONTEND_URL, etc.) were set in the Render dashboard. The database was hosted on Supabase; the connection string (with connection pooling) was set as DATABASE_URL. Prisma migrations were run as part of the deployment or manually to ensure the database schema is up to date. Health check endpoints (e.g., /api/health) were used to verify that the backend and database are reachable. Figure 4.5 illustrates the deployment architecture.

**Figure 4.5 Deployment Architecture**

Testing was conducted throughout development: unit tests for services (e.g., auth, location/Haversine), integration tests for API endpoints (e.g., login, class creation, attendance marking), and manual/user acceptance testing for critical user flows (teacher starts session, student scans and marks attendance, teacher sees real-time update, export CSV). The system was validated to meet the functional and non-functional requirements outlined in Chapter Three. The next chapter concludes the report with a summary of achievements, limitations, and recommendations.

---

# CHAPTER FIVE  
# CONCLUSION AND RECOMMENDATIONS

## 5.1 Conclusion

This project set out to design and develop a comprehensive web-based Smart Attendance Management System that utilises QR code technology, GPS location verification, and real-time communication to improve the accuracy, efficiency, and security of student attendance tracking in educational institutions. The project has achieved its aim and objectives.

The system addresses the critical problems identified in Chapter One: proxy attendance is mitigated through dynamic QR codes (regenerating at short intervals) combined with GPS location verification using the Haversine formula; manual record-keeping errors are reduced by automated capture of attendance with timestamps and location; inefficient data processing is addressed through instant recording and real-time updates; lack of real-time monitoring is addressed via WebSocket technology (Socket.io) so teachers see attendance as it is marked; and limited security is addressed through JWT authentication, bcrypt password hashing, input validation, rate limiting, and duplicate attendance prevention. The system was implemented using React 18 with TypeScript (frontend), Node.js with Express (backend), PostgreSQL with Prisma (database), and Socket.io (real-time), and was deployed on Firebase Hosting (frontend), Render (backend), and Supabase (database).

Table 5.1 summarises the objectives and their achievement.

**Table 5.1 Objectives and Achievement Summary**

| Objective | Achievement |
|-----------|-------------|
| Analyse existing systems and identify limitations | Literature review and requirements analysis completed |
| Design secure and scalable architecture | Three-tier architecture with security layers designed and documented |
| Develop full-stack web application | Frontend and backend implemented with teacher and student roles |
| Implement multi-layer security | JWT, bcrypt, rotating QR, GPS verification, validation, rate limiting implemented |
| Integrate real-time communication | Socket.io integrated for live attendance updates |
| Test comprehensively | Unit, integration, and user acceptance testing conducted |
| Deploy and document | Deployed on Firebase, Render, Supabase; documentation prepared |

The project contributes to the field of educational technology by demonstrating the effective integration of dynamic QR codes, geospatial validation, and real-time full-stack architectures in a single attendance management system. The system serves as a reference for institutions seeking to adopt secure, efficient, and user-friendly attendance solutions without heavy hardware investment.

## 5.2 Limitations

The following limitations are acknowledged:

**Time and Scope:** The project was completed within a defined timeframe. Advanced features such as automated email notifications, integration with external student information systems (SIS) or learning management systems (LMS), and native mobile applications were not implemented and are left for future phases.

**Resource and Infrastructure:** The system was deployed using free-tier or limited cloud services (Firebase Hosting, Render, Supabase). Very large institutions with high concurrent usage may require upgraded plans or additional scaling measures.

**GPS Accuracy:** Location verification depends on device GPS capabilities and environmental factors. Accuracy can vary (e.g., 5–10 m outdoors to 15–30 m indoors or 50 m in poor conditions). The system uses a configurable radius (default 50 m) to accommodate variation; hybrid location services (e.g., Wi-Fi positioning) could be explored in future work for improved indoor accuracy.

**User Base:** The system was designed for teachers and students. Administrative roles (e.g., institution-wide reporting) and parent or guardian access were not implemented and could be considered for future enhancements.

**Integration:** The system operates as a standalone application. Integration with existing institutional systems (SIS, LMS, identity providers) would require additional development and coordination with institutional IT.

**Data Privacy and Compliance:** While security measures (authentication, encryption, validation) were implemented, compliance with specific regional data protection regulations (e.g., GDPR, FERPA) may require additional configuration or policy alignment and could be addressed in future phases.

## 5.3 Recommendations

Based on the outcomes of this project, the following recommendations are made:

**For Educational Institutions:** Educational institutions are encouraged to consider adopting web-based attendance systems that combine dynamic QR codes and GPS verification to reduce proxy attendance and improve accuracy. The Smart Attendance system can serve as a prototype or reference for such adoption. Institutions should provide training and support to teachers and students to ensure smooth adoption and address digital literacy barriers where they exist.

**For Future Development:** Future work could include: (1) integration with student information systems and learning management systems for automated class and enrollment sync; (2) automated email or push notifications for session reminders and attendance confirmations; (3) expanded reporting and analytics (e.g., trends, at-risk students); (4) administrative dashboards for institution-wide oversight; (5) support for hybrid or Wi-Fi-based location when GPS is unreliable; and (6) optional native mobile applications for institutions that prefer app-based access.

**For Security and Compliance:** Institutions deploying the system should ensure that JWT secrets and database credentials are kept secure and that environment variables are not exposed. Regular security reviews and updates to dependencies are recommended. Where applicable, compliance with local data protection and privacy regulations should be verified and documented.

**For Research:** Further research could explore: (1) comparative studies of QR+GPS attendance systems versus biometric or RFID systems in terms of cost, accuracy, and user acceptance; (2) impact of real-time attendance feedback on student engagement and attendance rates; and (3) scalability and performance of WebSocket-based attendance systems under very high concurrency (e.g., large lecture halls or institution-wide rollouts).

By addressing these recommendations, the effectiveness, adoption, and long-term sustainability of the Smart Attendance Management System can be further improved for the benefit of educational institutions, teachers, and students.

---

# REFERENCES

1. Research Paper on Attendance Management System: Why Manual Tracking Is Failing Institutions Today? – vmedulife Software. Accessed December 25, 2025. https://vmedulife.com/blog/academic-planning/research-paper-on-attendance-management-system-why-manual-tracking-is-failing-institutions-today/

2. Which method of attendance-taking is superior? A systematic review. Accessed December 25, 2025. https://www.ikengajournal.com.ng/admin/img/paper/26_1-5.pdf

3. Geofencing and Location based Attendance System – ijarsct. Accessed December 25, 2025. https://www.ijarsct.co.in/Paper22404.pdf

4. A Modern Web-Based Student Attendance Management – IJIRT. Accessed December 25, 2025. https://ijirt.org/publishedpaper/IJIRT174142_PAPER.pdf

5. Smart Attendance Systems An Evaluation of FaceAttend and Its Role in Modernizing College Attendance. Accessed December 25, 2025. https://www.ijtsrd.com/papers/ijtsrd75018.pdf

6. Comparative Analysis of Attendance Management Systems – ijarcce. Accessed December 25, 2025. https://ijarcce.com/wp-content/uploads/2025/12/IJARCCE.2025.141293-Comparative.pdf

7. Smart Attendance System Using Location – International Journal of Scientific Research and Engineering Technology. Accessed December 25, 2025. https://ijsret.com/wp-content/uploads/IJSRET_V11_issue6_104.pdf

8. Smart Attendance System with Facial Recognition and GPS Verification – imrjr. Accessed December 25, 2025. https://imrjr.com/wp-content/uploads/2025/08/IMRJR.2025.020807.pdf

9. A Review of Students Attendance Management Systems – EURASIAN JOURNAL OF SCIENCE AND ENGINEERING. Accessed December 25, 2025. https://eajse.tiu.edu.iq/index.php/eajse/article/download/455/405

10. QR Code Based Smart Attendance System – IJSDR. Accessed December 25, 2025. https://ijsdr.org/papers/IJSDR2305173.pdf

11. Technology-Assisted Attendance Monitoring: A Case Study on QR Code System Usability and Performance. Accessed December 25, 2025. https://spm-online.com/jtal/index.php/journal/article/download/6/11/65

12. Design and Implementation of a Secure QR Code-Based Attendance Management System for Higher Education. ResearchGate. Accessed December 25, 2025. https://www.researchgate.net/publication/395911264_Design_and_Implementation_of_a_Secure_QR_Code-Based_Attendance_Management_System_for_Higher_Education

13. QR Code-Based Attendance Systems in Education: A Systematic Literature Review on Data Accuracy and Sustainable School Management. Accessed December 25, 2025. https://proceeding.raskhamedia.or.id/index.php/cessmuds/article/view/14

14. Enhancing Security using Bcrypt for Password Hashing – International Journal of Multidisciplinary. Accessed December 25, 2025. https://www.ijmrset.com/upload/50_Enhancing%20Security.pdf

15. WEB-BASED STUDENT ATTENDANCE MANAGEMENT SYSTEM: AN AUTOMATED APPROACH FOR EFFICIENT ACADEMIC MONITORING – IRJMETS. Accessed December 25, 2025. https://www.irjmets.com/upload_newfiles/irjmets70500125547/paper_file/irjmets70500125547.pdf

16. Security measures implemented in RESTful API Development. ResearchGate. Accessed December 25, 2025. https://www.researchgate.net/publication/384461158_Security_measures_implemented_in_RESTful_API_Development

17. Integrating Facial Recognition and GPS Technology for Efficient Attendance Management in Educational Institutions – Prosiding ARTEII. Accessed December 25, 2025. https://prosiding.arteii.or.id/index.php/ICEEI/article/download/21/26/176

18. Mobile Based Student Attendance System Using Geo-Fencing With Timing and Face Recognition – ResearchGate. Accessed December 25, 2025. https://www.researchgate.net/publication/361553012_Mobile_Based_Student_Attendance_System_Using_Geo-Fencing_With_Timing_and_Face_Recognition

19. Real-Time Web Applications with Node.js: Leveraging WebSockets. Zenodo. Accessed December 25, 2025. https://zenodo.org/records/15463738

20. Creating a scalable backend system tailored for managing student enrollment and attendance in a high school. Zigpoll. Accessed December 25, 2025. https://www.zigpoll.com/content/how-can-we-design-a-scalable-backend-system-to-handle-student-enrollment-data-and-manage-attendance-records-efficiently-for-a-high-school-management-platform

21. Design And Implementation Of A Web-Based Attendance Management System For Academic Institutions – IJCRT.org. Accessed December 25, 2025. https://www.ijcrt.org/papers/IJCRT24A4698.pdf

22. A Literature Review: Next-Gen React Chat Applications: Enhancing Real-Time Communication. Accessed December 25, 2025. https://www.ijisrt.com/assets/upload/files/IJISRT25MAR1476.pdf

23. Going real time with Socket.IO, Node.Js, and React. Medium. Accessed December 25, 2025. https://medium.com/@valentinog/going-real-time-with-socket-io-node-js-and-react-3e0f02d3d447

24. Development and Evaluation of a Real-Time Communication Web Application Using WebSocket's, React, Node.js, and MongoDB – UBT Knowledge Center. Accessed December 25, 2025. https://knowledgecenter.ubt-uni.net/cgi/viewcontent.cgi?article=4536&context=conference

25. Design and Implementation of a Student Attendance Management System based on Springboot and Vue Technology – ResearchGate. Accessed December 25, 2025. https://www.researchgate.net/publication/380813921_Design_and_Implementation_of_a_Student_Attendance_Management_System_based_on_Springboot_and_Vue_Technology

26. Design and Development of Attendance Management and Analysis System using LLM. ResearchGate. Accessed December 25, 2025. https://www.researchgate.net/publication/384031281_Design_and_Development_of_Attendance_Management_and_Analysis_System_using_LLM

27. QR-RAMS: QR code-based Reliable Attendance Management System. Accessed December 25, 2025. https://engfac.mans.edu.eg/images/cce-research-magazine/vol1/vol-1-4.pdf

28. Authentication Security in Web Applications: A Comprehensive Guide for Developers – Clerk. Accessed December 25, 2025. https://clerk.com/articles/authentication-security-in-web-applications

29. Web Application Security Vulnerabilities | Top Risks – Aikido. Accessed December 25, 2025. https://www.aikido.dev/blog/top-web-application-security-vulnerabilities

30. Secure Web Application Building: A Developer's Guide – Athena Global Technologies. Accessed December 25, 2025. https://athenagt.com/building-secure-web-application-developers-guide/

31. The Passwordless Authentication with Passkey Technology from an Implementation Perspective – arXiv. Accessed December 25, 2025. https://arxiv.org/html/2508.11928v1

32. MERN Stack Chat Application – ijrpr. Accessed December 25, 2025. https://ijrpr.com/uploads/V5ISSUE11/IJRPR35351.pdf

33. What is Software Security: 10 Best Practices to Secure Apps – Strapi. Accessed December 25, 2025. https://strapi.io/blog/software-security-best-practices-guide

34. The Power of UI/UX Design Principles for eLearning Mobile Apps – Addicta. Accessed December 25, 2025. https://addictaco.com/the-power-of-ui-ux-design-principles-for-elearning-mobile-apps/

35. 5 UX Design Principles Every Education App Should Follow – Medium. Accessed December 25, 2025. https://medium.com/@Studio21/5-ux-design-principles-every-education-app-should-follow-1f2c818e0012

36. Classification of Barriers to Digital Transformation in Higher Education Institutions: Systematic Literature Review – MDPI. Accessed December 25, 2025. https://www.mdpi.com/2227-7102/13/7/746

37. Responsive Web Design in Higher Ed – EDUCAUSE Review. Accessed December 25, 2025. https://er.educause.edu/articles/2015/11/responsive-web-design-in-higher-ed

38. Investigating the User Interface Design Frameworks of Current Educational Technology Applications – MDPI. Accessed December 25, 2025. https://www.mdpi.com/2227-7102/13/1/94

39. UAT Testing Blueprint: Building a Successful User Acceptance Framework – CloudQA. Accessed December 25, 2025. https://cloudqa.io/uat-testing-blueprint-building-a-successful-user-acceptance-framework/

40. Unit Testing vs. Integration Testing: A Complete Guide to Balancing Cost and Quality. Accessed December 25, 2025. https://www.frugaltesting.com/blog/unit-testing-vs-integration-testing-a-complete-guide-to-balancing-cost-and-quality

41. Integration Testing: A Comprehensive guide with best practices – Opkey. Accessed December 25, 2025. https://www.opkey.com/blog/integration-testing-a-comprehensive-guide-with-best-practices

42. Full-Stack Testing: A Comprehensive Overview – TestDevLab. Accessed December 25, 2025. https://www.testdevlab.com/blog/full-stack-testing-a-comprehensive-overview

43. Mastering User Acceptance Testing (UAT) – A Complete Guide – HeadSpin. Accessed December 25, 2025. https://www.headspin.io/blog/the-ultimate-user-acceptance-testing-guide

44. User Acceptance Testing: Complete Guide with Examples – Functionize. Accessed December 25, 2025. https://www.functionize.com/automated-testing/acceptance-testing-a-step-by-step-guide

45. End-to-End Testing in 2025: Complete Beginner's Guide – Bunnyshell. Accessed December 25, 2025. https://www.bunnyshell.com/blog/introduction-to-end-to-end-testing-everything-you-/

46. Agile UAT checklist: How to conduct user acceptance testing – COAX Software. Accessed December 25, 2025. https://coaxsoft.com/blog/how-to-conduct-user-acceptance-testing

47. Challenges and Impacts of Technology Adoption in Education: A Systematic Literature Review – International Journal of Research and Innovation in Social Science. Accessed December 25, 2025. https://rsisinternational.org/journals/ijriss/articles/challenges-and-impacts-of-technology-adoption-in-education-a-systematic-literature-review/

48. A Systematic Literature Review of Barriers Affecting e-Learning in Higher Education – ERIC. Accessed December 25, 2025. https://files.eric.ed.gov/fulltext/EJ1483657.pdf

---

# APPENDICES

## Appendix A: Sample Title Page (GTUC Format)

As per GTUC Manual Appendix A: Title page with institution name (GTUC), Faculty of Informatics, project title, statement of partial fulfillment, degree/diploma, author name(s), supervisor name, and month/year.

## Appendix B: Sample Declaration (GTUC Format)

As per GTUC Manual Appendix B: Declaration stating the work is the author's own, not copied, with sources acknowledged; signature lines for author, student ID, date, supervisor, and HOD.

## Appendix C: Prisma Schema (Key Models)

The key models implemented in the database are: User (id, email, password, name, role, indexNumber, session, program, isEmailVerified, timestamps); UserSettings (userId, emailNotifications, sessionReminders, defaultSessionDuration, defaultAllowedRadius, lateThresholdMinutes); LoginSession (userId, token, deviceId, loginAt, expiresAt, isActive); Class (id, name, description, code, teacherId, allowedRadius, lateThresholdMinutes, sessionDurationMins, isActive, timestamps); Enrollment (studentId, classId, status, enrolledAt); QRSession (id, classId, token, latitude, longitude, status, createdAt, expiresAt, endedAt); Attendance (id, studentId, classId, qrSessionId, latitude, longitude, distance, status, markedAt, deviceInfo). Full schema is available in the project repository (backend/prisma/schema.prisma).

## Appendix D: API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | User login |
| GET | /api/auth/me | Current user profile |
| GET/POST | /api/classes | List/Create classes |
| GET/PATCH/DELETE | /api/classes/:id | Get/Update/Delete class |
| POST | /api/classes/:id/enroll | Student enroll with code |
| POST | /api/qr/start | Start QR session |
| POST | /api/qr/validate | Validate token and mark attendance |
| GET | /api/attendance | List attendance (by class/session) |
| GET | /api/export/csv | Export attendance as CSV |

## Appendix E: Environment Variables

Backend: DATABASE_URL (PostgreSQL connection string), JWT_SECRET, FRONTEND_URL (for CORS), NODE_ENV (development/production). Frontend: VITE_API_URL (backend base URL), VITE_WS_URL (WebSocket URL). These are documented in the project's .env.example files.

---

*End of Report*

**Document Version:** 1.0  
**Last Updated:** [Date]  
**Total Pages:** Approximately 86+ (when formatted per GTUC manual: 1.5 spacing, 10pt Times New Roman, margins as specified)
