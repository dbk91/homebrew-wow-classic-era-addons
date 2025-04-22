cask "questie" do
  version "10.20.2"
  sha256 "51d9f6c8380babc7a4087937f3ba5492c95b469a257d96aaf6cadb4715bc7261"

  url "https://github.com/Questie/Questie/releases/download/v#{version}/Questie-v#{version}.zip"
  name "Questie"
  desc "Questie: The WoW Classic quest helper"
  homepage "https://github.com/Questie/Questie"

  addon_dir = File.expand_path("/Applications/World of Warcraft/_classic_era_/Interface/AddOns")

  preflight do
    FileUtils.mkdir_p addon_dir unless Dir.exist?(addon_dir)
  end

  artifact "Questie", target: "#{addon_dir}/Questie"

  zap trash: [
    "#{addon_dir}/Questie"
  ]
end
