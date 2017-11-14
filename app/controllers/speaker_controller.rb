# frozen_string_literal: true

class SpeakerController < ApplicationController
  def index
    @speakers = Speaker.top_speakers
    @parties = Party.min_members(3)

    @party = Party.find(params[:id]) if params[:id]
  end

  def show
    @speaker = Speaker.find(params[:id])

    @statements = get_speaker_statements(@speaker)

    @stats = @speaker.stats
    @veracities = Veracity.all
  end

  private
    def get_speaker_statements(speaker)
      statements = if params[:veracity]
        speaker.statements_by_veracity(params[:veracity])
      else
        speaker.statements.published
      end

      statements.page(params[:page])
    end
end
