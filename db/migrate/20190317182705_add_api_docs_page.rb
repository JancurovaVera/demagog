class AddApiDocsPage < ActiveRecord::Migration[5.2]
  def change
    page = Page.create(title: "API pro vývojáře", slug: "api-pro-vyvojare", published: true, template: "api_docs")

    menu_item_order_last = MenuItem.all.map { |menu_item| menu_item.order }.max
    MenuItem.create(title: "API pro vývojáře", kind: "page", page: page, order: menu_item_order_last + 1)
  end
end
