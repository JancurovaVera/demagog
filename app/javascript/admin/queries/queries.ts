import gql from 'graphql-tag';

export const GetPages = gql`
  query GetPages($title: String, $offset: Int, $limit: Int) {
    pages(includeUnpublished: true, offset: $offset, limit: $limit, title: $title) {
      id
      title
      slug
      published
    }
  }
`;

export const GetPage = gql`
  query GetPage($id: ID!) {
    page(id: $id, includeUnpublished: true) {
      id
      title
      slug
      published
      textHtml
      textSlatejson
    }
  }
`;

export const GetArticle = gql`
  query GetArticle($id: ID!) {
    article(id: $id, includeUnpublished: true) {
      id
      articleType
      title
      slug
      perex
      published
      publishedAt
      illustration
      segments {
        id
        segmentType
        textHtml
        textSlatejson
        source {
          id
        }
      }
      source {
        id
      }
    }
  }
`;

export const GetArticles = gql`
  query GetArticles($title: String, $offset: Int, $limit: Int) {
    articles(includeUnpublished: true, offset: $offset, limit: $limit, title: $title) {
      id
      articleType
      title
      slug
      published
      publishedAt
    }
  }
`;

export const GetMediaPersonalities = gql`
  query GetMediaPersonalities($name: String) {
    mediaPersonalities(name: $name) {
      id
      name
    }
  }
`;

export const GetMediaPersonality = gql`
  query GetMediaPersonality($id: ID!) {
    mediaPersonality(id: $id) {
      id
      name
    }
  }
`;

export const GetMedia = gql`
  query GetMedia($name: String) {
    media(name: $name) {
      id
      name
    }
  }
`;

export const GetMedium = gql`
  query GetMedium($id: ID!) {
    medium(id: $id) {
      id
      name
    }
  }
`;

export const GetSources = gql`
  query GetSources($name: String, $offset: Int, $limit: Int) {
    sources(
      name: $name
      offset: $offset
      limit: $limit
      includeOnesWithoutPublishedStatements: true
    ) {
      id
      name
      sourceUrl
      releasedAt
      medium {
        id
        name
      }
      mediaPersonalities {
        id
        name
      }
      statementsCountsByEvaluationStatus {
        evaluationStatus
        statementsCount
      }
      statements {
        id
      }
      expert {
        id
        firstName
        lastName
      }
    }
  }
`;

export const GetSource = gql`
  query GetSource($id: Int!) {
    source(id: $id) {
      id
      name
      sourceUrl
      releasedAt
      transcript
      medium {
        id
        name
      }
      mediaPersonalities {
        id
        name
      }
      statementsCountsByEvaluationStatus {
        evaluationStatus
        statementsCount
      }
      speakers {
        id
        firstName
        lastName
      }
      expert {
        id
        firstName
        lastName
      }
    }
  }
`;

export const GetSourcesForSelect = gql`
  query GetSourcesForSelect {
    sources(offset: 0, limit: 10000, includeOnesWithoutPublishedStatements: true) {
      id
      name
      releasedAt
      medium {
        id
        name
      }
    }
  }
`;

// TODO: add pagination and control limit
export const GetSourceStatements = gql`
  query GetSourceStatements($sourceId: Int!, $includeUnpublished: Boolean) {
    statements(limit: 200, source: $sourceId, includeUnpublished: $includeUnpublished) {
      id
      content
      important
      published
      speaker {
        id
        firstName
        lastName
        avatar
      }
      assessment {
        id
        evaluationStatus
        evaluator {
          id
          firstName
          lastName
        }
        veracity {
          id
          key
          name
        }
        shortExplanation
        shortExplanationCharactersLength
        explanationCharactersLength
      }
      statementTranscriptPosition {
        id
        startLine
        startOffset
        endLine
        endOffset
      }
      commentsCount
      sourceOrder
    }
  }
`;

export const GetUsers = gql`
  query GetUsers($name: String, $includeInactive: Boolean) {
    users(limit: 100, name: $name, includeInactive: $includeInactive) {
      id
      email
      firstName
      lastName
      avatar
      active
      bio
      positionDescription
      emailNotifications
      userPublic
      rank
      role {
        id
        name
      }
    }
  }
`;

export const GetUser = gql`
  query GetUser($id: Int!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      avatar
      active
      bio
      positionDescription
      emailNotifications
      userPublic
      role {
        id
        name
      }
    }
  }
`;

export const GetBodies = gql`
  query GetBodies($name: String) {
    bodies(limit: 100, name: $name) {
      id
      logo
      link
      name
      isParty
      isInactive
      shortName
      foundedAt
      terminatedAt
    }
  }
`;

export const GetBody = gql`
  query GetBody($id: Int!) {
    body(id: $id) {
      id
      logo
      link
      name
      isParty
      isInactive
      shortName
      foundedAt
      terminatedAt
    }
  }
`;

export const GetSpeakerBodies = gql`
  query GetSpeakerBodies {
    bodies(limit: 1000) {
      id
      name
      shortName
      isInactive
      terminatedAt
    }
  }
`;

export const GetSpeaker = gql`
  query GetSpeaker($id: Int!) {
    speaker(id: $id) {
      id
      firstName
      lastName
      websiteUrl
      avatar
      memberships {
        id
        body {
          id
          shortName
        }
        since
        until
      }
    }
  }
`;

export const GetSpeakers = gql`
  query GetSpeakers($name: String) {
    speakers(limit: 100, name: $name) {
      id
      firstName
      lastName
      avatar
      websiteUrl
      body {
        shortName
      }
      memberships {
        id
        body {
          id
          shortName
        }
        since
        until
      }
    }
  }
`;

export const GetStatement = gql`
  query GetStatement($id: Int!) {
    statement(id: $id, includeUnpublished: true) {
      id
      content
      important
      published
      excerptedAt
      countInStatistics
      speaker {
        id
        firstName
        lastName
        avatar
      }
      assessment {
        id
        explanationHtml
        explanationSlatejson
        shortExplanation
        evaluationStatus
        evaluator {
          id
          firstName
          lastName
        }
        veracity {
          id
          key
          name
        }
      }
      source {
        id
        name
        sourceUrl
        releasedAt
        medium {
          id
          name
        }
        mediaPersonalities {
          id
          name
        }
        expert {
          id
          firstName
          lastName
        }
      }
      statementTranscriptPosition {
        id
      }
      commentsCount
    }
  }
`;

export const GetStatementComments = gql`
  query GetStatementComments($id: Int!) {
    statement(id: $id, includeUnpublished: true) {
      id
      commentsCount
      comments {
        id
        content
        user {
          id
          firstName
          lastName
        }
        createdAt
      }
    }
  }
`;

export const GetRoles = gql`
  query GetRoles {
    roles {
      id
      key
      name
    }
  }
`;

export const GetCurrentUser = gql`
  query GetCurrentUser {
    currentUser {
      id
      firstName
      lastName
      email
      role {
        id
        key
        name
        permissions
      }
    }
  }
`;

export const GetContentImages = gql`
  query GetContentImages($name: String, $offset: Int, $limit: Int) {
    contentImages(offset: $offset, limit: $limit, name: $name) {
      totalCount
      items {
        id
        image
        image50x50
        name
        createdAt
        user {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

export const GetNotifications = gql`
  query GetNotifications($includeRead: Boolean, $offset: Int, $limit: Int) {
    notifications(includeRead: $includeRead, offset: $offset, limit: $limit) {
      totalCount
      items {
        id
        content
        actionLink
        actionText
        createdAt
        readAt
      }
    }
  }
`;
