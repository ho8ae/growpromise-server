# 쑥쑥약속 - 식물과 함께하는 약속관리 ! <img src="https://github.com/user-attachments/assets/a777105e-fd2b-472d-b1d1-36d9f12cf54c" align=left width=100>

> 다양한 식물카드와 스티커로 자녀의 약속을 재밌게 관리! (2025.05.05 ~ 2026.06.17 v1.0.3)

<br/>

[🔗 App Store ](https://apps.apple.com/kr/app/%EC%91%A5%EC%91%A5%EC%95%BD%EC%86%8D/id6746965526)
<br/>

[🔗 Google Play Store ](https://play.google.com/store/apps/details?id=com.low_k.growpromise)

<br/>

<img width="100%" src="https://github.com/user-attachments/assets/268e8ff6-b861-4194-a53f-440b80513fae">

<br/><br/>

## 💁‍♂️ 서비스 소개
<img src="https://github.com/user-attachments/assets/9d0160d1-8e56-482e-a1ad-e21a97d0d200" width="100%">

<br/><br/>

## 🎈Developers

| PE | 
| --- | 
|<img src="https://avatars.githubusercontent.com/u/126559845?v=4" width=200px/> |
|[@Low](https://github.com/ho8ae)|



<br/><br/>

## 🎈 기획 배경

<img src="https://github.com/user-attachments/assets/e183c2c4-da06-4c42-a58b-379ee03a7f52" width="100%">
<img src="https://github.com/user-attachments/assets/6dc33657-fb5c-4b5d-baa9-e4ecf9aa81bf" width="100%">
<img src="https://github.com/user-attachments/assets/756197f2-9d9d-4e0a-87a5-9ee1defdad0d" width="100%">

<br/><br/>

## ✨ 주요 기능

<img src="https://github.com/user-attachments/assets/e617b27f-5032-4cfb-9afd-2047bce6a206" width="100%">
<img src="https://github.com/user-attachments/assets/5fb85a12-bfd3-46e5-8fb5-5b56c951694c" width="100%">


<br/><br/>

## 🛠️ 기술 & 아키텍처

<img src="https://github.com/user-attachments/assets/5da566fb-ce4b-4e54-a4c7-20ccf67423e7" width="100%">
<img src="https://github.com/user-attachments/assets/7f957e13-6d7a-4fd7-94d4-d30528e07d0e" width="100%">


<br/><br/>

## 노력한 점

### 다양한 인터렉티브한 UI/UX를 구현하였습니다.

| <img src="https://github.com/user-attachments/assets/4244d7b5-97ef-4dfb-af4c-30c32ba68b71" alt="이미지1" width="90%"> | <img src="https://github.com/user-attachments/assets/4f2f509d-9662-4249-b457-29590802fa5e" alt="이미지2" width="100%"> |<img src="https://velog.velcdn.com/images/ho8ae/post/5d24e68a-7ef9-44e0-b5c6-e7a14ff3c110/image.gif" alt="이미지2" width="100%">|
|-------------------------------------------------------|-------------------------------------------------------|------------|
|식물 카드 뽑기 화면 |홈 화면|로그인 화면|


### 스켈레톤 UI도 적용하며 유저 사용자 경험을 증가해봤습니다.
<img src='https://velog.velcdn.com/images/ho8ae/post/fdf4f962-5102-409a-8413-a548a175b66f/image.gif' width="30%" />



<br/><br/>

## 느낀점

>`기획`,`마케팅`,`개발`,`디자인`,`배포` 까지 혼자서 진행했습니다. 개발하는 과정에서 프론트와 서버 설정 그리고 인프라에 대해서 고민을 많이 하게 되었습니다. 

>이전에는 프론트 쪽의 UI/UX를 맡아서 개발했지만,  이번에는 상태관리와 최적화에 대한 노력을 많이 했다. AI를 사용하면 함수를 호출 할 때 **useEffect**를 계속해서 사용하게 되는데, 이는 렌더링이 계속되어 효율이 안 좋아지는 걸 알게 되었습니다. 따라서 **useMemo**를 통한 캐싱 방법과 적절한 useEffect를 사용하려고 노력하였습니다. 또한 `zustand`를 통해  auth,ui 에 대한 상태관리에 대해 알게 되었고, `React Query`로 실시간으로 서버의 상태 변화를 통해 서버의 신선도를 측정하여 데이터를 가져오는 것을 알게 되었습니다. 이는 `쑥쑥약속`의 성장 완료 시 부모 및 자녀에게 데이터를 바로 전달하는 **plant**에 정말 중요하게 작용했습니다.

> 이번 프로젝트에서 여러 API를 다루면서 **패턴**을 중요하게 생각했습니다. 각 routes에 접두사로 API를 나누고, 폴더안에는 **controller**, **validation**, **routes**, **services** 이렇게 4개로 분리하여 나눴습니다. 그리고 **middleware**를 통해서 토큰 관리 및 에러 메시지를 관리 하였습니다. 이런 비슷한 도메인을 다뤄본적이 없어서, API를 계속해서 수정하는 등 초기 설정에 대한 안 좋은 코드들이 있어서 서버는 더 예민하게 기획을 해야 겠다고 생각했습니다. 

> 테이블의 확장 및 필드를 용이하게 하기 위해서 `postgreSql` 를 사용하였고 ORM은 `Prisma`를 사용했는데, 단순 CRUD를 불러오는 과정이 많아 postgreSql 특성상 메모리를 많이 잡아 먹을까 걱정이 됩니다. 이후 적절한 쿼리를 수정하거나, MySQL 마이그레이션이 필요하다고 느끼고 있습니다.

> 서버는 아직 트래픽이 몰리지 않고, 비용적인 측면을 고려하여 `AWS freetier`를 사용하여 단일 서버로 여러 서비스를 하고 있는 서버에 `docker-compose`를 사용해 환경설정 하였습니다. 이후 트래픽이 생기게 되면 서버의 메모리를 늘리거나, 새로 바꿔야 된다고 생각하고 있습니다. `CI/CD` 부분에서 deploy할 때 마다, 기존 컨테이너만 삭제하고 이미지와 볼륨이 자꾸 남게되어 한번 씩 정기적으로 정리하게 되는데 이런 것도 자동화를 해야겠다고 생각했습니다.

<br/><br/>

## 앞으로 계획

- 지속적인 분석과 기록을 통해 어플의 관리 방향성 찾기
- 글로벌화를 고려해 영어, 일본어 추가하기
- 최적화 및 서버 비용 관리

<br/><br/>
