<div align="center">

# Back End Online Examination System

![Completion](https://img.shields.io/badge/style-100%25-00e600?label=Completion&logo=java&logoColor=red&style=for-the-badge)

</div>

Dự án tập trung vào việc xử lý các thao tác cơ bản cho một trang web tổ chức và quản lý các khóa học, làm bài kiểm tra trực tuyến, và nộp bài tập. Nó bao gồm các chức năng cơ bản như đăng ký, đăng nhập, quản lý hồ sơ người dùng, tổ chức khóa học, quản lý thi, quản lý bài tập, tham gia kiểm tra, nộp bài tập, chia sẻ câu hỏi thi, quản lý người tham gia khoá học, thống kê kết quả, và thanh toán trực tuyến.

- [Thành viên nhóm](#thành-viên-nhóm)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Mô tả hệ thống](#mô-tả-hệ-thống)

<br>

## Thành Viên Nhóm
| STT | Họ Tên        | MSSV     |
|-----|---------------|----------|
| 1   | Lê Văn Cường  | 19110332 |
| 2   | Trần Bảo Duy  | 19110339 |

## Công Nghệ Sử Dụng
### Kiến trúc chung của hệ thống
#### MongoDB
- Phiên bản MongoDB sử dụng: 6.0
- Dùng làm hệ quản trị cơ sở dữ liệu

#### Express
- Phiên bản sử dụng: 4.17.3
- Backend Restful API với NodeJS

#### React
- Phiên bản sử dụng: 18.2.0
- Xây dựng giao diện cho hệ thống

#### NodeJS
- Phiên bản sử dụng: 16.13.1
- Backend Restful API với framework ExpressJS

#### Công nghệ khác
- **Axios**: Cung cấp các thao tác với API
- **React Hook Form**: Hỗ trợ xử lý form dữ liệu trên ReactJS
- **Passport và Passport Google OAuth 2.0**: Hỗ trợ xác thực với Google và Facebook
- **MaterialUI (MUI)**: Thư viện hỗ trợ thiết kế giao diện cho ứng dụng, cung cấp các component thông dụng
- **CKEditor**: Thư viện cung cấp bộ công cụ nhập văn bản có định dạng trên trang web
- **FaceAPI.JS**: Sử dụng để giám sát tự động, phòng chống người dùng gian lận khi thi trực tuyến
- **Dialogflow**: Xây dựng Chat bot tự động hỗ trợ giải đáp thắc mắc của người dùng

## Mô tả hệ thống
### Giáo viên
- Đăng ký, đăng nhập
- Quản lý tài khoản cá nhân
- Tạo và quản lý các khoá học
- Tạo và quản lý đề thi và bài tập, bài giảng trên khoá học
- Quản lý học viên trong khoá học
- Thống kê kết quả các lượt thi trong đề thi và bài nộp trong bài tập

### Học viên
- Đăng ký, đăng nhập
- Quản lý tài khoản cá nhân
- Tham gia vào các khoá học
- Làm bài thi, làm bài tập, xem các bài giảng trong khoá học
- Xem kết quả bài thi và bài tập
- Thống kê kết quả học tập trong khoá học
- Nhận chứng chỉ khi hoàn thành khóa học

### Quản trị viên
- Quản lý người dùng trên hệ thống
- Quản lý quyền hạn người dùng trên hệ thống
- Quản lý các khoá học
- Quản lý và thống kê doanh thu
- [Thành viên nhóm](#thành-viên-nhóm)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Mô tả hệ thống](#mô-tả-hệ-thống)
<br>

## Thành Viên Nhóm
| stt | Họ Tên  | MSSV |
|---| ----- | -------- |
| 1 | Lê Văn Cường | 19110332 |
| 2 | Trần Bảo Duy | 19110339 |
## Công Nghệ Sử Dụng
Kiến trúc chung của hệ thống
### MongoDB
- Phiên bản MongoDB sử dụng: 6.0
- Dùng làm hệ quản trị cơ sở dữ liệu
### Express
- Phiên bản sử dụng: 4.17.3
- Backend Restful API với NodeJS.
### React
- Phiên bản sử dụng: 18.2.0
- Xây dựng giao diện cho hệ thống
### NodeJS
- Phiên bản sử dụng: 16.13.1
- Backend Restful APIvới framework ExpressJS.
### Công nghệ khác
- Axios: Cung cấp các thao tác với API.
- React hook form: Hỗ trợ xử lý form dữ liệu trên ReactJS.
- Passpost và Passpost Google auth20:Hỗ trợ xác thực với Google và Facebook.
- MaterialUI (MUI): Thư viện hỗ trợ thiết kế giao diện cho ứng dụng, cung cấp các component thông dụng.
- CK Editor: Thư viện cung cấp bộ công cụ nhập văn bản có định dạng trên trang web.
- FaceAPI.JS: Sử dụng để giám sát tự động, phòng chống người dùng gian lận khi thi trực tuyến.
- Dialogflow: Xây dựng Chat bot tự động hỗ trợ giải đáp thắc mắc của người dùng.
## Mô tả hệ thống
### Giáo viên
- Đăng ký, đăng nhập.
- Quản lý tài khoản cá nhân.
- Tạo và quản lý các khoá học.
- Tạo và quản lý đề thi và bài tập, bài giảng trên khoá học.
- Quản lý học viên trong khoá học.
- Thống kê kết quả các lượt thi trong đề thi và bài nộp trong bài tập.
### Học viên
- Đăng ký, đăng nhập 
- Quản lý tài khoản cá nhân.
- Tham gia vào các khoá học.
- Làm bài thi, làm bài tập, xem các bài giảng trong khoá học.
- Xem kết quả bài thi và bài tập.
- Thống kê kết quả học tập trong khoá học.
- Nhận chứng chỉ khi hoàn thành khóa học.
### Quản trị viên
- Quản lý người dùng trên hệ thống.
- Quản lý quyền hạn người dùng trên hệ thống.
- Quản lý các Khoá học.
- Quản lý và thống kê doanh thu.