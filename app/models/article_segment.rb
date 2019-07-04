# frozen_string_literal: true

class ArticleSegment < ApplicationRecord
  TYPE_TEXT = "text"
  TYPE_SOURCE_STATEMENTS = "source_statements"
  TYPE_PROMISE = "promise"

  belongs_to :source, optional: true
  belongs_to :article, optional: true

  scope :ordered, -> {
    order(order: :asc)
  }

  scope :source_statements_type_only, -> {
    where(segment_type: ArticleSegment::TYPE_SOURCE_STATEMENTS)
  }

  def is_text?
    segment_type == ArticleSegment::TYPE_TEXT
  end

  def is_source_statements?
    segment_type == ArticleSegment::TYPE_SOURCE_STATEMENTS
  end

  def is_promise?
    segment_type == ArticleSegment::TYPE_PROMISE
  end

  def all_published_statements
    return [] unless is_source_statements?

    source.statements.published_important_first
  end

  def filtered_published_statements(statements_filters)
    return [] unless is_source_statements?

    filtered = source.statements.published_important_first

    if statements_filters[:speaker_id]
      filtered = filtered.where(speaker_id: statements_filters[:speaker_id])
    end

    if statements_filters[:veracity_key]
      filtered = filtered
        .joins(assessment: :veracity)
        .where(assessments: {
          veracities: {
            key: statements_filters[:veracity_key]
          }
        })
    end

    filtered
  end
end
