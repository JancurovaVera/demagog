# frozen_string_literal: true

include ActionDispatch::TestProcess

FactoryBot.define do
  factory :attachment, aliases: [:illustration] do
    file { "photo.png" }
  end

  factory :media_personality

  factory :medium

  factory :source do
    name { "Source name" }
    medium
    released_at { 1.week.ago }
    source_url { "http://example.com" }

    after(:create) do |source|
      create(:media_personality, sources: [source])
    end
  end

  factory :article_type

  factory :article do
    sequence :title do |n|
      "Article title #{n}"
    end

    perex { "Lorem ipsum" }
    illustration
    published { true }
    published_at { 1.day.ago }

    factory :fact_check do
      association :article_type, factory: :article_type, name: "default"
    end

    factory :static do
      association :article_type, factory: :article_type, name: "static"
    end
  end

  factory :article_segment do
    factory :article_segment_text do
      segment_type { "text" }
    end

    factory :article_segment_source_statements do
      segment_type { "source_statements" }
    end
  end

  factory :body do
    transient do
      member_count { 5 }
    end

    after(:create) do |party, evaluator|
      create_list(:membership, evaluator.member_count, body: party)
    end

    factory :presidential_candidates do
      name { "Presidental candidates" }

      is_party { false }
    end

    factory :party do
      name { "Party A" }
      short_name { "pa" }

      is_party { true }
    end
  end

  factory :user do
    first_name { "John" }
    last_name { "Doe" }
    active { true }

    trait :admin do
      role_id { Role.find_by(key: Role::ADMIN).id }
    end
    trait :expert do
      role_id { Role.find_by(key: Role::EXPERT).id }
    end
    trait :social_media_manager do
      role_id { Role.find_by(key: Role::SOCIAL_MEDIA_MANAGER).id }
    end
    trait :proofreader do
      role_id { Role.find_by(key: Role::PROOFREADER).id }
    end
    trait :intern do
      role_id { Role.find_by(key: Role::INTERN).id }
    end
  end

  factory :assessment do
    statement
    association :evaluator, factory: :user
    veracity { Veracity.find_by(key: Veracity::TRUE) }
    assessment_methodology { AssessmentMethodology.find_by(name: "Demagog.cz fact-checking metodika") }

    evaluation_status { Assessment::STATUS_APPROVED }
    explanation_html { "Lorem ipsum <strong>dolor</strong> sit amet" }

    trait :being_evaluated do
      evaluation_status { Assessment::STATUS_BEING_EVALUATED }
    end

    trait :approval_needed do
      evaluation_status { Assessment::STATUS_APPROVAL_NEEDED }
    end

    trait :proofreading_needed do
      evaluation_status { Assessment::STATUS_PROOFREADING_NEEDED }
    end

    trait :promise_assessment do
      veracity { nil }
      promise_rating { PromiseRating.find_by(key: PromiseRating::FULFILLED) }
      assessment_methodology { AssessmentMethodology.find_by(name: "Demagog.cz metodika analýzy slibů druhé vlády Andreje Babiše") }
    end
  end

  factory :statement do
    statement_type { Statement::TYPE_FACTUAL }
    speaker
    source
    content { "Lorem ipsum dolor sit amet" }
    published { true }
    count_in_statistics { true }
    excerpted_at { 1.month.ago }
    important { false }

    after(:create) do |statement|
      if statement.statement_type == Statement::TYPE_FACTUAL
        create(:assessment, statement: statement)
      end
      if statement.statement_type == Statement::TYPE_PROMISE
        create(:assessment, :promise_assessment, statement: statement)
      end
    end

    trait :important do
      important { true }
    end

    trait :unpublished do
      published { false }
    end

    trait :with_transcript_position do
      transient do
        transcript_position { [0, 0, 0, 20] }
      end

      after(:create) do |statement, evaluator|
        create(
          :statement_transcript_position,
          statement: statement,
          source: statement.source,
          start_line: evaluator.transcript_position[0],
          start_offset: evaluator.transcript_position[1],
          end_line: evaluator.transcript_position[2],
          end_offset: evaluator.transcript_position[3],
        )
      end
    end

    trait :promise_statement do
      statement_type { Statement::TYPE_PROMISE }
      title { "Promise title" }
    end

    factory :important_statement, traits: [:important]
    factory :unpublished_statement, traits: [:unpublished]
  end

  factory :statement_transcript_position

  factory :membership do
    speaker
    body
  end

  factory :speaker do
    first_name { "John" }
    last_name  { "Doe" }

    transient do
      statement_count { 3 }
      statement_source { nil }
    end

    after(:create) do |speaker, evaluator|
      statement_props = { speaker: speaker }
      statement_props[:source] = evaluator.statement_source if evaluator.statement_source

      create_list(:important_statement, evaluator.statement_count, statement_props)
    end

    factory :speaker_with_party do
      transient do
        memberships_count { 1 }
      end

      after(:create) do |speaker, evaluator|
        create_list(:membership, evaluator.memberships_count, speaker: speaker)
      end
    end
  end
end
