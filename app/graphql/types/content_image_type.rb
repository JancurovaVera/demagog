# frozen_string_literal: true

module Types
  class ContentImageType < BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :created_at, Types::Scalars::DateTimeType, null: false
    field :user, Types::UserType, null: true

    field :image, String, null: false

    def image
      Rails.application.routes.url_helpers.rails_public_blob_url(object.image)
    end

    field :image_50x50, String, null: false

    def image_50x50
      Rails.application.routes.url_helpers.rails_public_blob_url(
        object.image.variant(resize: "50x50"),
      )
    end
  end
end
