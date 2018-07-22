# frozen_string_literal: true

class Source < ApplicationRecord
  belongs_to :medium, optional: true
  has_many :articles
  has_many :statements
  has_many :statement_transcript_positions
  has_and_belongs_to_many :speakers
  belongs_to :media_personality, optional: true
  belongs_to :expert, class_name: "User", optional: true

  default_scope { where(deleted_at: nil) }

  def self.matching_name(name)
    where("name LIKE ?", "%#{name}%")
  end

  def update_statements_source_order(ordered_statement_ids)
    Source.transaction do
      statements.update_all(source_order: nil)

      unless ordered_statement_ids.nil?
        ordered_statement_ids.each_with_index do |statement_id, index|
          self.statements.find(statement_id).update!(source_order: index)
        end
      end
    end

    statements.reload
    self
  end
end
