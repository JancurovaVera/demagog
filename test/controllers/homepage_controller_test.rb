# frozen_string_literal: true

require "test_helper"

class HomepageControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    speaker = create(:speaker)
    source =
      create(
        :source,
        speakers: [speaker],
        statements: [create(:statement, speaker: speaker), create(:statement, speaker: speaker)]
      )
    segment = create(:article_segment_source_statements, source: source)
    create(:fact_check, segments: [segment])

    get root_url
    assert_response :success
  end

  test "deleted articles should not be present on the homepage" do
    article_one = create(:fact_check, title: "Article one", segments: [], published: true)
    article_two = create(:fact_check, title: "Article two", segments: [], published: true)
    article_three = create(:fact_check, title: "Article three", segments: [], published: true)

    article_three.discard!

    get root_url
    assert_response :success
    assert_select ".container-homepage-cover_story a", text: article_two.title
    assert_select "h2.s-title", text: article_one.title, count: 1
    # Not listed cause it's cover story
    assert_select "h2.s-title", text: article_two.title, count: 0
    # Not listed cause it's deleted
    assert_select "h2.s-title", text: article_three.title, count: 0
  end
end
